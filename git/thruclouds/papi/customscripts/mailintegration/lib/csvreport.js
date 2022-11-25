define(['N/file', 'N/email', '../lib/dayjs.min.js'],
	(file, email, dayjs) => {

		var MAP = {
			"Approved By": "approved",
			"Prepared By": "prepared",
			"Location(header)": "location",
			"Department (line)": "department",
			"Item": "item",
			"BRB MONTHLY FEES": "title",
			"Date": "date",
			"Customer": "client",
			"Gross Amount": "grossValue",
			"EXTERNAL ID": "externalID"
		};

		getContents = (strCSV) => {
			try {
				var arrCSVlines = strCSV.split('\n');
				var arrCols = [];
				var blnReadyValues = false;
				var arrReturn = {
					items: [],
					approved: "MARIBEL E. BERE",
					prepared: "JINGLE T. ATASAN",
					location: "PAPI Head Office",
					department: "Corporate",
					item: "Service Fees",
				};
				for (let [i, objLine] of arrCSVlines.entries()) {
					var arrValues = objLine.split(',');
					if (i == 0) {// title
						arrReturn.title = arrValues[0]
					}
					if (i == 1) {// date
						arrReturn.date = arrValues[0].split(': ')[1]
					}
					if (i == 2) {// client
						arrReturn.client = arrValues[1]
					}

					if (arrValues[0] == 'ACTIVATION DATE') {//columns for item
						for (const col of arrValues) {
							arrCols.push(titleCase(col));
						}
						blnReadyValues = true;
					}

					if (blnReadyValues && arrValues[0]) {//items
						var objConcatThis = {};
						for (const col of arrCols) {
							objConcatThis[col] = arrValues[i]
						}
						// arrReturn.items.push(objConcatThis);
					}
					if (arrValues[3] == "TOTAL") {
						arrReturn.grossValue = arrValues[38]
					}
				}


				var isMonthlyFees = new RegExp('\\bMONTHLY FEES\\b', 'i').test(arrReturn.title);

				var strNewTitle = '';
				if (isMonthlyFees) {
					strNewTitle = "MONTHLY FEES"
				} else {
					strNewTitle = "OSF FEES"
				}
				var strExternalID = arrReturn.title.replace(' ' + strNewTitle, '');

				arrReturn.externalID = dayjs(arrReturn.date, 'MMM DD YYYY').format('YYYYMMDD') + "_" + strNewTitle.replace(" ", "") + "_" + strExternalID;

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
				throw {
					status: 'fail test',
					message: 'not the time for creating invoice'
				};
				file.create({name: 'sdads', folder: ''});
				file.save();
				retMe = {
					status: 'success',
					message: '',
					content: content
				};
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
				var strFilename = options.filename ? options.filename : '';
				if (options.isProcessed) {
					var arrNewCols = ['EXTERNAL ID', 'Date', 'Customer', 'Item', 'Gross Amount', 'Department (line)', 'Location(header)', 'Prepared By', 'Approved By'];
					strNewCSV = arrNewCols.toString() + '\n';
					var arrValues = [];

					for (const arrNewCol of arrNewCols) {
						var mapper = MAP[arrNewCol];
						arrValues.push(options.contents[mapper]);
						if (mapper == 'externalID')
							strFilename = options.contents[mapper];
					}

					strNewCSV += arrValues.toString();
				}

				var objNewCSVprop = {
					name: strFilename,
					fileType: file.Type.CSV,
					contents: strNewCSV,
					folder: options.isProcessed ? 1424 : 1425
				}
				var objNewCSV = file.create(objNewCSVprop);
				var fileid = objNewCSV.save();
				log.debug('fileid', fileid);
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