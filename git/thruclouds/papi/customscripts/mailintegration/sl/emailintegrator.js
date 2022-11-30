/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['../lib/csvreport'],
	(csvreport) => {
		const onRequest = (scriptContext) => {
			try {
				const params = scriptContext.request.parameters;
				const action = params.action;
				const attachment = params.attachment;
				const author = params.author;
				const subject = params.subject;
				const filename = params.filename;
				const body = params.body;
				log.debug('params', params)

				if (action == 'createInvoice' && subject.includes("MONTHLY FEES")) {
					// var samplefile = file.load({id: 35986}) // for testing
					// var filename = samplefile.name
					// var value = samplefile.getContents();

					log.debug('creating Invoice')
					var strContents = csvreport.getContents(attachment, filename);

					log.debug('strContents',strContents);
					var objInvoice = csvreport.createInv(strContents);
					var objToProcess = {};

					log.debug('objInvoice', objInvoice)
					if (objInvoice.isProcessed) {
						objToProcess = {
							author: author,
							contents: strContents,
							invID: objInvoice.id,
							isProcessed: true
						};
					} else {
						objToProcess = {
							author: author,
							contents: attachment,
							isProcessed: false,
							filename: filename,
						};
					}
					var objCSV = csvreport.createCsv(objToProcess);
					if (!objInvoice.isProcessed) {
						var objReason = {
							status: objInvoice.contents.status,
							message: objInvoice.contents.message,
							fileid: objCSV.fileid,
							filename: objCSV.name,
							author: author,
							subject: subject,
							body: body
						};
						csvreport.sendEmail({contents: strContents, reason: objReason});
					}
				}

				if (action == 'nofileCreateInvoice') {
					var objReason = {
						status: 'failed',
						message: 'No file to be processed,\n please attach a file',
						author: author,
						subject: subject,
						body: body
					};
					csvreport.sendEmail({contents: strContents, reason: objReason});
				}

			} catch (e) {
				log.debug('e', e)
			}
		}
		return {onRequest}
	});


// var strContents = getContents(arrFile.getValue());
//
// var objInvoice = JSON.parse(createInv(strContents));
//
// if (objInvoice.isProcessed) {
// 	var strObj = {contents: strContents, invID: objInvoice.id}
// 	var objCSV = createCsv(strObj);
// 	log.debug('debug', 'newCSV', objCSV);
// } else {
// 	var objReason = {
// 		status: 'failed',
// 		message: 'some error'
// 	};
// 	sendEmail({contents: strContents, reason: objReason});
// }