/******************************************************************************* 
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global alert confirm orion window widgets eclipse:true serviceRegistry define */
/*jslint browser:true eqeqeq:false laxbreak:true */
define(['i18n!git/nls/gitmessages', 'require', 'dojo', 'orion/auth', 'orion/commands', 'orion/git/widgets/CloneGitRepositoryDialog', 
        'orion/git/widgets/GitCredentialsDialog', 'orion/widgets/NewItemDialog', 'orion/git/widgets/RemotePrompterDialog'], 
        function(messages, require, dojo, mAuth, mCommands) {

	var exports = {};

	var internal = {};
	
	internal.handleKnownHostsError = function(serviceRegistry, errorData, options, func){
		if(confirm(dojo.string.substitute(messages["Would you like to add ${0} key for host ${1} to continue operation? Key fingerpt is ${2}."],
				[errorData.KeyType, errorData.Host, errorData.HostFingerprint]))){
			var sshService = serviceRegistry.getService("orion.net.ssh"); //$NON-NLS-0$
			sshService.addKnownHosts(errorData.Host + " " + errorData.KeyType + " " + errorData.HostKey).then(function(){ //$NON-NLS-1$ //$NON-NLS-0$
				sshService.getKnownHosts().then(function(knownHosts){
					options.knownHosts = knownHosts;
					func(options);
				});
				if(options.failedOperation){
					var progressService = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
					dojo.hitch(progressService, progressService.removeOperation)(options.failedOperation.Location, options.failedOperation.Id);
				}
			});
		}
	};

	internal.handleSshAuthenticationError = function(serviceRegistry, errorData, options, func, title){
		var credentialsDialog = new orion.git.widgets.GitCredentialsDialog({
			title: title,
			serviceRegistry: serviceRegistry,
			func: func,
			errordata: options.errordata,
			failedOperation: options.failedOperation
		});
		
		credentialsDialog.startup();
		credentialsDialog.show();
		if(options.failedOperation){
			var progressService = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
			dojo.hitch(progressService, progressService.removeOperation)(options.failedOperation.Location, options.failedOperation.Id);
		}
	};

	internal.getDefaultSshOptions = function(serviceRegistry, authParameters){
		var def = new dojo.Deferred();
		var sshService = serviceRegistry.getService("orion.net.ssh"); //$NON-NLS-0$
		var sshUser =  authParameters && !authParameters.optionsRequested ? authParameters.valueFor("sshuser") : ""; //$NON-NLS-0$
		var sshPassword = authParameters && !authParameters.optionsRequested ? authParameters.valueFor("sshpassword") : ""; //$NON-NLS-0$
		sshService.getKnownHosts().then(function(knownHosts){
			def.callback({
						knownHosts: knownHosts,
						gitSshUsername: sshUser,
						gitSshPassword: sshPassword,
						gitPrivateKey: "",
						gitPassphrase: ""
			});
		});
		return def;
	};

	internal.translateResponseToStatus = function(response){
		var json;
		try{
			json = JSON.parse(response.responseText);
		}catch (e) {
			json = {Result: response.responseText};
		}
		json.HttpCode = response.status;
		return json;
	};

	internal.handleProgressServiceResponse = function(jsonData, options, serviceRegistry, callback, callee, title){
		if(jsonData && jsonData.status){
			jsonData = internal.translateResponseToStatus(jsonData);
		}
		if(!jsonData || !jsonData.HttpCode){
			if(callback){
				callback(jsonData);
			}
			return;
		}
		switch (jsonData.HttpCode) {
		case 200:
		case 201:
		case 202:
			if(callback){
				callback(jsonData.Result);
			}
			return;
		case 401:
			if(jsonData.JsonData){
				options.errordata = jsonData.JsonData;
			}
			if(jsonData.failedOperation){
				options.failedOperation = jsonData.failedOperation;
			}
			dojo.hitch(this, internal.handleSshAuthenticationError)(serviceRegistry, jsonData.JsonData, options, callee, title);
			return;
		case 400:
			if(jsonData.JsonData && jsonData.JsonData.HostKey){
				if(jsonData.failedOperation){
					options.failedOperation = jsonData.failedOperation;
				}
				dojo.hitch(this, internal.handleKnownHostsError)(serviceRegistry, jsonData.JsonData, options, callee);
				return;
			}
		default:
			var display = [];
			display.Severity = "Error"; //$NON-NLS-0$
			display.HTML = false;
			
			try {
				display.Message = jsonData.DetailedMessage ? jsonData.DetailedMessage : jsonData.Message;
			} catch (Exception) {
				display.Message = error.message;
			}
			
			serviceRegistry.getService("orion.page.message").setProgressResult(display); //$NON-NLS-0$
			break;
		}
			
	};

	internal.gatherSshCredentials = function(serviceRegistry, data, title){
		var def = new dojo.Deferred();

		var triggerCallback = function(sshObject){
			serviceRegistry.getService("orion.net.ssh").getKnownHosts().then(function(knownHosts){ //$NON-NLS-0$
				def.callback({
					knownHosts: knownHosts,
					gitSshUsername: sshObject.gitSshUsername,
					gitSshPassword: sshObject.gitSshPassword,
					gitPrivateKey: sshObject.gitPrivateKey,
					gitPassphrase: sshObject.gitPassphrase
				});
			});
		};
		
		var errorData = data.errorData;

		// if this is a known hosts error, show a prompt always
		if (errorData && errorData.HostKey) {
			if(confirm(dojo.string.substitute(messages['Would you like to add ${0} key for host ${1} to continue operation? Key fingerpt is ${2}.'],
					[errorData.KeyType, errorData.Host, errorData.HostFingerprint]))){
				var sshService = serviceRegistry.getService("orion.net.ssh"); //$NON-NLS-0$
				sshService.addKnownHosts(errorData.Host + " " + errorData.KeyType + " " + errorData.HostKey).then( //$NON-NLS-1$ //$NON-NLS-0$
					function(){
						triggerCallback({ gitSshUsername: "", gitSshPassword: "", gitPrivateKey: "", gitPassphrase: ""}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					}
				);					
			}
			return def;
		}
		
		if (!data.parameters && !data.optionsRequested){
			triggerCallback({ gitSshUsername: "", gitSshPassword: "", gitPrivateKey: "", gitPassphrase: ""}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			return def;
		}

		// try to gather creds from the slideout first
		if (data.parameters && !data.optionsRequested) {
			var sshUser =  data.parameters ? data.parameters.valueFor("sshuser") : ""; //$NON-NLS-0$
			var sshPassword = data.parameters ? data.parameters.valueFor("sshpassword") : "";	 //$NON-NLS-0$
			triggerCallback({ gitSshUsername: sshUser, gitSshPassword: sshPassword, gitPrivateKey: "", gitPassphrase: ""}); //$NON-NLS-0$
			return def;
		}
		
		// use the old creds dialog
		var credentialsDialog = new orion.git.widgets.GitCredentialsDialog({
			title: title,
			serviceRegistry: serviceRegistry,
			func: triggerCallback,
			errordata: errorData
		});
		
		credentialsDialog.startup();
		credentialsDialog.show();

		return def;
	};

	exports.createCommand = function(serviceRegistry, commandService, explorer, fileClient, toolbarId, selectionTools) {
		
		var cloneParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("url", "url", messages['Repository URL:'])], {hasOptionalParameters: true}); //$NON-NLS-1$ //$NON-NLS-0$

		var cloneGitRepositoryCommand = new mCommands.Command({
			name : messages["Clone Repository"],
			tooltip : messages["Clone Repository Tooltip"],
			description: messages["Clone Repository Description"],
			id : "orion.git.clone", //$NON-NLS-0$
			parameters: cloneParameters,
			callback : function(data) {
				var cloneFunction = function(gitUrl, path, name) {
					internal.getDefaultSshOptions(serviceRegistry).then(function(options) {
						var func = arguments.callee;
						serviceRegistry.getService("orion.page.message").createProgressMonitor(
							cloneGitRepository(name, gitUrl, path, explorer.treeRoot.Location, options.gitSshUsername, options.gitSshPassword, options.knownHosts, //$NON-NLS-0$
								options.gitPrivateKey, options.gitPassphrase),
								messages["Cloning repository: "] + gitUrl).deferred.then(function(jsonData, secondArg) {
									internal.handleProgressServiceResponse(jsonData, options, serviceRegistry, function(jsonData) {
								if (explorer.changedItem) {
									dojo.hitch(explorer, explorer.changedItem)(explorer.treeRoot, true);
								}
							}, func, messages['Clone Git Repository']);
						}, function(jsonData, secondArg) {
							internal.handleProgressServiceResponse(jsonData, options, serviceRegistry, function() {}, func, messages['Clone Git Repository']);
						});
					});
				};
				
				if (data.parameters.valueFor("url") && !data.parameters.optionsRequested) { //$NON-NLS-0$
					cloneFunction(data.parameters.valueFor("url")); //$NON-NLS-0$
				} else {
					var dialog = new orion.git.widgets.CloneGitRepositoryDialog({
						serviceRegistry: serviceRegistry,
						fileClient: fileClient,
						url: data.parameters.valueFor("url"), //$NON-NLS-0$
						alwaysShowAdvanced: data.parameters.optionsRequested,
						func: cloneFunction
					});
							
					dialog.startup();
					dialog.show();
				}
			},
			visibleWhen : function(item) {
				return true;
			}
		});
		
		var cloneGitRepository = function(gitName, gitRepoUrl, targetPath, repoLocation, gitSshUsername, gitSshPassword, gitSshKnownHost, privateKey, passphrase) {
			var postData = {};
			if(gitName){
				postData.Name = gitName;
			}
			if(targetPath){
				postData.Path = targetPath;
			}
			if(gitRepoUrl){
				postData.GitUrl=gitRepoUrl;
			}
			postData.Location = repoLocation;
			if(gitSshUsername){
				postData.GitSshUsername = gitSshUsername;
			}
			if(gitSshPassword){
				postData.GitSshPassword = gitSshPassword;
			}
			if(gitSshKnownHost){
				postData.GitSshKnownHost = gitSshKnownHost;
			}
			if(privateKey) postData.GitSshPrivateKey=privateKey;
			if(passphrase) postData.GitSshPassphrase=passphrase;			
			
			//NOTE: require.toURL needs special logic here to handle "gitapi/clone"
			var gitapiCloneUrl = require.toUrl("gitapi/clone/._"); //$NON-NLS-0$
			gitapiCloneUrl = gitapiCloneUrl.substring(0,gitapiCloneUrl.length-2);
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url : gitapiCloneUrl,
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				postData : dojo.toJson(postData),
				handleAs : "json", //$NON-NLS-0$
				timeout : 15000,
				load : function(jsonData, xhrArgs) {
					_getGitServiceResponse(clientDeferred, jsonData, xhrArgs);
				},
				error : function(error, ioArgs) {
					return _handleGitServiceResponseError(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		};
		
		var _getGitServiceResponse = function(clientDeferred, jsonData, xhrArgs){
			if(xhrArgs && xhrArgs.xhr.status === 202){
				var deferred = new dojo.Deferred();
				deferred.callback(jsonData);
				return serviceRegistry.getService("orion.page.progress").showWhile(deferred).then(function(progressResp) { //$NON-NLS-0$
					var returnData = progressResp.Result.Severity == "Ok" ? progressResp.Result.JsonData : progressResp.Result; //$NON-NLS-0$
					clientDeferred.callback(returnData);
					return;
				});
			}
			clientDeferred.callback(jsonData);
			return;
		};
		
		var _handleGitServiceResponseError = function(deferred, currentXHR, error, ioArgs, retryFunc){
			if(!deferred)
				deferred = new dojo.Deferred();
			if (error.status === 401 || error.status === 403) {
				if(mAuth.handleAuthenticationError(ioArgs.xhr, function(){
						if(!retryFunc){
							deferred.errback(error);
							return;
						}
						retryFunc(currentXHR).then(
								function(result, ioArgs) {
									deferred.callback(result, ioArgs);
								},
								function(error, ioArgs) {
									deferred.errback(error, ioArgs);
								});						
					})==null)
						return deferred;
				else{
					deferred.errback(error);
					return deferred;
				}
			}
			
			deferred.errback(error);
			return deferred;
		};
		
		commandService.addCommand(cloneGitRepositoryCommand);
	};

	return exports;	
});
