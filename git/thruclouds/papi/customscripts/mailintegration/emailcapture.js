function process(email) {
	try {
		nlapiLogExecution('debug', email)
		var arrFiles = email.getAttachments();
		var url = nlapiResolveURL('SUITELET', 'customscript_email_integrator', 'customdeploy_email_integrator', 'external')

		var postData = {};

		if (arrFiles.length) {
			for (var i = 0; i < arrFiles.length; i++) {
				var arrFile = arrFiles[i];
				postData = {
					attachment: arrFile.getValue(),
					filename: arrFile.getName(),
					action: "createInvoice",
					author: email.getFrom(),
					subject: email.getSubject(),
					body: email.getHtmlBody(),
				};
			}
		} else if (!arrFiles.length) {
			postData = {
				action: 'nofileCreateInvoice',
				author: email.getFrom(),
				message: 'no file attached',
				subject: email.getSubject(),
				body: email.getHtmlBody(),
			};
		}

		var response = nlapiRequestURL(url, postData);
		nlapiLogExecution('debug', 'response', response.getBody());

	} catch (e) {
		nlapiLogExecution('debug', 'Error :', e);
	}
}