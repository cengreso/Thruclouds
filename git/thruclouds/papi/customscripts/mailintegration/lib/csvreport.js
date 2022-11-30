define(['N/record', 'N/query', 'N/file', 'N/email', '../lib/dayjs.min.js'],
	(record, query, file, email, dayjs) => {

		var MAP = {
			"Customer": "customerName",
			"Approved By": "custbody_psg_sal_ph_approved_by",
			"Prepared By": "custbody_psg_sal_ph_received_by",
			"Department": "departmentName",
			"Location": "locationName",
			"Item": "itemName",
			"Date": "trandateText",
			"Gross Amount": "grossamt",
			"EXTERNAL ID": "externalid"
		};

		getContents = (strCSV, filename) => {
			const VALUES = {
				item:{
					text:'Service Fees',
					value:16
				},
				department:{
					text:'Corporate',
					value:19
				},
				location: {
					text:'PAPI Head Office',
					value:1
				}
			};
			try {
				var arrCSVlines = strCSV.split('\r\n');
				var arrCols = [];
				var blnReadyValues = false;
				var arrReturn = {item:{}};
				var entity;
				var tempdate = '';
				for (let [i, objLine] of arrCSVlines.entries()) {
					var arrValues = objLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
					if (i == 0) {// title
						arrReturn.title = arrValues[0];
					}
					if (i == 1) {// date
						tempdate = arrValues[0].split(':')[1];
						tempdate = tempdate[0]==' '?tempdate.slice(1):tempdate;

						log.debug('tempdate',tempdate);
						arrReturn.trandate = tempdate?dayjs(tempdate,'MMM DD YYYY').format('MM/DD/YYYY'):'';
						arrReturn.trandateText = tempdate?dayjs(tempdate,'MMM DD YYYY').format('MMM DD, YYYY'):'';
						log.debug('ArrReturn Date', arrReturn);
					}
					if (i == 2) {// client
						entity = arrValues[1].replaceAll('"','');
						// arrReturn.entity = arrValues[1];
					}

					if (arrValues[0] == 'ACTIVATION DATE') { //columns for item
						for (const col of arrValues) {
							arrCols.push(titleCase(col));
						}
						blnReadyValues = true;
					}

					if (blnReadyValues && arrValues[0]) {//items
						var objConcatThis = {};
						for (const col of arrCols) {
							objConcatThis[col] = arrValues[i];
						}
						// arrReturn.items.push(objConcatThis);
					}
					if (arrValues[3] == "TOTAL") {
						arrReturn.grossamt = arrValues[38];
						arrReturn.item.grossamt = arrValues[38];
					}
				}
				arrReturn = {
					...arrReturn,
					custbody_psg_sal_ph_approved_by: "Maribel E Bere",
					custbody_psg_sal_ph_received_by: "Jingle Atasan",
					item: {
						item: VALUES.item.value,
						itemName:VALUES.item.text,
						department: VALUES.department.value,
						departmentName:VALUES.department.text,
						...arrReturn.item,
					}
				};
				var objCustomer = query.runSuiteQL({query: `SELECT entityId, id FROM customer WHERE LOWER(entityId) LIKE LOWER('${entity}')`}).asMappedResults()[0];

				arrReturn = Object.assign({
					entity: objCustomer?objCustomer.id:0,
					customerName:objCustomer?objCustomer.entityid:'',
					location: VALUES.location.value,
					locationName: VALUES.location.text
				}, arrReturn);

				arrReturn.externalid = filename.replace('.csv','');

				return arrReturn;
			} catch (e) {
				log.debug('e', e)
			}
		}

		titleCase = (str) => {
			var arrSplitStr = str.toLowerCase()
				.replaceAll('.', '')
				.replaceAll('_', ' ')
				.split(' ');
			for (var i = 0; i < arrSplitStr.length; i++) {
				if (i > 0)
					arrSplitStr[i] = arrSplitStr[i].charAt(0).toUpperCase() + arrSplitStr[i].substring(1);
			}
			return arrSplitStr.join('');
		}

		createInv = (options) => {
			var retMe = {};
			var isProcessed = false;
			try {
				var content = options;
				log.debug('createInv', content);
				// throw {status: 'fail test', message: 'not the time for creating invoice'};
				if(!content.customerName)
					throw {message:'No customer found in the CSV'};
				if(!content.trandate)
					throw {message:'No transaction date found in the CSV'};
				if(!content.grossamt)
					throw {message:'No Gross Amount found in the CSV'};
				if(!content.item.grossamt)
					throw {message:'No Gross Amount found in the CSV'};

				const invRec = record.create({type: record.Type.INVOICE, isDynamic: true});

				const arrSetByValue = ['location', 'externalid', 'entity'];
				for (let contKey in content) {
					var objValue = {fieldId: contKey, value: content[contKey], text: content[contKey]};
					if (contKey != 'item') {
						if (arrSetByValue.includes(contKey)) {
							invRec.setValue(objValue);
						} else {
							invRec.setText(objValue);
						}
					} else {
						invRec.selectNewLine({sublistId: 'item'});
						for (const itemKey in content[contKey]) {
							var item = content[contKey];
							var objValueItems = {sublistId: 'item', fieldId: itemKey, value: item[itemKey]};
							invRec.setCurrentSublistValue(objValueItems);
						}
						invRec.commitLine({sublistId: 'item'});
					}
				}
				// var invId = invRec.save({ignoreMandatoryFields:true});
				// log.debug('invId',invId);
				retMe = {
					status: 'success',
					message: '',
					content: content
				};
				log.debug('success');
				isProcessed = true;
			} catch (e) {
				log.debug('createInv', e);
				retMe = {
					status: 'failed',
					message: e.message
				};
			}
			return {isProcessed: isProcessed, contents: retMe};
		}

		createCsv = (options) => {
			try {
				log.debug('createCsv', options);
				var strNewCSV = options.contents;
				if (options.isProcessed) {
					var arrNewCols = ['EXTERNAL ID', 'Date', 'Customer', 'Item', 'Gross Amount', 'Department', 'Location', 'Prepared By', 'Approved By'];
					var arrItemCols=['Item', 'Gross Amount', 'Department'];
					strNewCSV = arrNewCols.toString() + '\n';
					var arrValues = [];

					for (const arrNewCol of arrNewCols) {
						var mapper = MAP[arrNewCol];
						if(arrItemCols.includes(arrNewCol)) {
							for (const itemKey in options.contents.item) {
								arrValues.push('"'+options.contents.item[mapper]+'"');
								break;
							}
						} else {
							arrValues.push('"'+options.contents[mapper]+'"');
						}
					}
					strNewCSV += arrValues.toString();
				}

				var objNewCSVprop = {
					name: options.isProcessed?options.contents.externalid:options.filename,
					fileType: file.Type.CSV,
					contents: strNewCSV,
					folder: options.isProcessed ? 1424 : 1425
				};

				log.debug('objNewCSVprop',objNewCSVprop);
				var objNewCSV = file.create(objNewCSVprop);
				var fileid = objNewCSV.save();
				objNewCSVprop.fileid = fileid;
				return objNewCSVprop;

			} catch (e) {
				log.debug('createCsv', e)
			}
		}

		sendEmail = (options) => {
			try {
				log.debug('sendEmail', options);
				var objFile = {};
				var objToEmail = {
					author: 619,
					/*
					* to verify if creating an employee only for sending email back to author
					* because using generated email cannot be re-use
					*
					* */
					recipients: options.reason.author,
					subject: 'do-not-reply [ERROR]: ' + options.reason.subject,
					body: options.reason.message,
				}
				if (options.reason.fileid) {
					objFile = file.load({id: options.reason.fileid})
					objToEmail.attachments = [objFile]
				}
				email.send(objToEmail);
			} catch (e) {
				log.debug('sendEmail', e)
			}
		}

		return {
			getContents: getContents,
			createInv: createInv,
			createCsv: createCsv,
			sendEmail: sendEmail
		}
	})