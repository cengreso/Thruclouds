define([], () => {

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
						objConcatThis[col] = arrValues[j]
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

			log.debug('debug', 'arrReturn', JSON.stringify(arrReturn))
			return JSON.stringify(arrReturn);
		} catch (e) {
			log.debug('debug', 'e', e)
		}
	}

	titleCase = (str) => {
		var strSplitStr2 = replaceAll(str.toLowerCase(), ".", '');
		var strSplitStr1 = replaceAll(strSplitStr2, '_', ' ');
		var arrSplitStr = strSplitStr1.split(' ');
		for (var i = 0; i < arrSplitStr.length; i++) {
			if (i > 0)
				arrSplitStr[i] = arrSplitStr[i].charAt(0).toUpperCase() + arrSplitStr[i].substring(1);
		}
		return arrSplitStr.join('');
	}

	replaceAll = (string, search, replace) => {
		return string.split(search).join(replace);
	}


	createInv = (options) => {
		log.debug('debug', 'createInv typeof', typeof options);
		log.debug('debug', 'createInv content', options);
		var contents = JSON.parse(options);
		log.debug('debug', 'createInv', contents);
		return JSON.stringify({isProcessed: true, contents: contents});
	}
	createCsv = (options) => {
		try {

			log.debug('debug', 'createCsv', options);

			var arrNewCols = ['EXTERNAL ID', 'Date', 'Customer', 'Item', 'Gross Amount', 'Department (line)', 'Location(header)', 'Prepared By', 'Approved By'];
			var strNewCSV = arrNewCols.toString() + '\n';
			var arrValues = [];

			for (var ctr = 0; ctr < arrNewCols.length; ctr++) {
				var arrNewCol = arrNewCols[ctr];
				var mapper = MAP[arrNewCol];
				log.debug('debug', 'option.contents', options.contents[mapper]);
				arrValues.push(options.contents[mapper]);
			}

			strNewCSV += arrValues.toString();

			log.debug('debug', 'strNewCSV', strNewCSV);

			// nlapiCreateFile('csv/processed/' + option.contents[MAP[arrNewCols["EXTERNAL ID"]]] + '.csv', 'CSV', strNewCSV);
			return strNewCSV;

		} catch (e) {
			log.debug('error', 'createCsv', e)
		}

	}

	sendEmail = (options) => {

	}

	return {}
})