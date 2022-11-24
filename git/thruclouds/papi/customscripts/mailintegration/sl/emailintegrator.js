/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([],
	() => {
		const onRequest = (scriptContext) => {
			log.debug('scriptContext', scriptContext.request.parameters)
			var action = scriptContext.request.parameters.action;
			if(action == "emailcsvimport"){

			}
		}
		return {onRequest}
	});
