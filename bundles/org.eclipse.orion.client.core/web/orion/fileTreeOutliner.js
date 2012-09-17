/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global window define */
 
/*jslint forin:true*/

define(['require', 'orion/EventTarget', 'orion/explorers/explorer-table'], function(require, EventTarget, FileExplorer){

	/**
	 * Instantiates a file tree outliner, which uses a navigation explorer model to populate
	 * an outliner.
	 *
	 * @name orion.fileTreeOutliner.FileTreeOutliner
	 * @class A service for showing the contents of a file tree.
	 * as favorites.
	 */
	function FileTreeOutliner(options) {
		EventTarget.attach(this);
		this._init(options);
	}
	FileTreeOutliner.prototype = /** @lends orion.fileTreeOutliner.FileTreeOutliner.prototype */ {
		_init: function(options) {
			this._registry = options.serviceRegistry;
			this._fileClient = options.fileService;
			this._serviceRegistration = this._registry.registerService("orion.edit.outliner", this, {//$NON-NLS-0$
				nameKey: "Navigator", //$NON-NLS-0$
				nls: "orion/editor/nls/messages", //$NON-NLS-0$
				id: "orion.edit.outliner.navigator", //$NON-NLS-0$
				contentType: ["text/plain"] //$NON-NLS-0$
			});
		},
		
		_expandRecursively: function(tree, model, node, path){
			var that = this;
			tree.expand(node, function(){
				model.getChildren(node, function(children){
					if(children === undefined || children === null) {
						return;
					}
					for (var i=0; i<children.length; i++){
						if (path.indexOf(children[i].Name) === 0) {
							that._expandRecursively(tree, model, children[i], path.slice(children[i].Name.length+1));
						}
					}
				});
			});
		},
		
		getOutline: function(contents, path) {
			var fileClient = this._fileClient;
			var that = this;
			return fileClient.read(path, true).then(function(fileMetadata) {
				if (fileMetadata.Parents && fileMetadata.Parents.length > 0) {
					return fileClient.read(fileMetadata.Parents[fileMetadata.Parents.length - 1].Location, true).then(function (folderMetadata) {
						folderMetadata.label = folderMetadata.Name;
						folderMetadata.href = "";
						var treeModel = new FileExplorer.FileExplorerModel(this._registry, {children: [folderMetadata]}, fileClient, "outliner");  //$NON-NLS-0$
						treeModel.hasChildren = function(item) {
							return item.Directory;
						};
						treeModel.adornHook = function(item) {
							// attach attributes that the OutlinerRenderer expects to be there
							item.label = item.Name;
							item.href = item.Directory ? "" : "#"+item.Location;
						};
						treeModel.doExpansions = function(tree) {
							var indexInFilePath = fileMetadata.Location.indexOf(folderMetadata.Location);
							if (indexInFilePath >= 0) {
								that._expandRecursively(tree, treeModel, folderMetadata, fileMetadata.Location.slice(indexInFilePath+folderMetadata.Location.length));
							}
						};
						return {model: treeModel};
					});
				} else {
					return [];
				}
			});
		}
	};
	FileTreeOutliner.prototype.constructor = FileTreeOutliner;

	//return module exports
	return {
		FileTreeOutliner: FileTreeOutliner
	};
});
