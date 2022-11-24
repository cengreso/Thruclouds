function process(email) {
	try {
		nlapiLogExecution('debug', email)
		var arrFiles = email.getAttachments();

		nlapiLogExecution('debug', 'Attachments Size', arrFiles.length);
		for (var i = 0; i < arrFiles.length; i++) {
			var arrFile = arrFiles[i];

			//
			var url = nlapiResolveURL('SUITELET', 'customscript_email_integrator', 'customdeploy_email_integrator','external')
			nlapiLogExecution('debug', 'url', url)
			var response = nlapiRequestURL(url, {
				action: 'emailcsvimport',
				file: arrFile.getValue()
			});

			nlapiLogExecution('debug', 'response', response.getBody());

			var strContents = getContents(arrFile.getValue());

			var objInvoice = JSON.parse(createInv(strContents));

			if (objInvoice.isProcessed) {
				var strObj = {contents: strContents, invID: objInvoice.id}
				var objCSV = createCsv(strObj);
				nlapiLogExecution('debug', 'newCSV', objCSV);
			} else {
				var objReason = {
					status: 'failed',
					message: 'some error'
				};
				sendEmail({contents: strContents, reason: objReason});
			}
		}
	}catch(e){
		nlapiLogExecution('debug', 'Error :', e);
	}
}