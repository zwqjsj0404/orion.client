/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global orion window console define localStorage*/
/*jslint browser:true*/

define(['i18n!orion/settings/nls/messages', 'require' ], 
	
	function(messages, require) {

		function ProjectGrid( node, projects ){
		
			this.projectData = projects;				
			this.anchorNode = node;
			this.anchorNode.innerHTML = this.template;	
			this.projectNode = this.anchorNode.firstChild;
			this.tileButton = this.projectNode.firstChild.firstChild;
			this.listButton = this.projectNode.firstChild.lastChild;
			this.tileButton.onclick = this.showProjectTiles.bind(this);
			this.listButton.onclick = this.showProjectTable.bind(this);
			this.showProjectTable( this.listNode );
			
		}
		
		ProjectGrid.prototype.constructor = ProjectGrid;
		
		var projectData;		
		ProjectGrid.prototype.projectData = projectData;
		
		var anchorNode;
		ProjectGrid.prototype.anchorNode = anchorNode;

		var projectNode;
		ProjectGrid.prototype.projectNode = projectNode;

		var listNode;
		ProjectGrid.prototype.listNode = listNode;

		var template =	'<div id="projects" class="projects">' +
							'<div class="buttonBox">' +
								'<div role="button" class="leftButton" tabindex="0" aria-pressed="false" style="-webkit-user-select: none;" aria-label="Switch to List" data-tooltip="Switch to List">' +
									'<div class="core-sprite-thumbnail"></div>' +
								'</div>' +
								'<div role="button" class="rightButton" tabindex="0" aria-pressed="false" style="-webkit-user-select: none;" aria-label="Switch to List" data-tooltip="Switch to List">' +
									'<div class="core-sprite-list"></div>' +
								'</div>' +
							'</div>' +
							'<div id="listNode" class="projectListNode"></div>' +
						'</div>';							
											
		ProjectGrid.prototype.template = template;
		
		function showProjectTiles(parent, name){
		
			this.tileButton.style.background = '#E0E0E0';
			this.listButton.style.background = 'white';
		
			this.listNode = this.anchorNode.firstChild.lastChild;
			
			var listChild = this.listNode.firstChild;

			while( listChild ) {
			    this.listNode.removeChild( listChild );
			    listChild = this.listNode.firstChild;
			}
		
			var tileTemplate = '<ol class="thumb-grid group"></ol>';
			
			this.listNode.innerHTML = tileTemplate;
			
			for( var count = 0; count< this.projectData.length; count++ ){
				
				var listItem = document.createElement('li');
				
				var date = this.projectData[count].date.getMonth() + 1 + "." + this.projectData[count].date.getDate() + "." + this.projectData[count].date.getFullYear();
				
				var w = this.listNode.clientWidth * 0.79;
				var h = w * 0.75;
				
				var content = '<a href="#" height="' + h + 'px"></a>';
				
				if( this.projectData[count].path ){
				
					/* iframe.sandbox = "allow-scripts allow-same-origin" */
					
					content = '<div class="tab"><a href="#"><div class="iframeOverlay"></div><iframe src="' + this.projectData[count].path + '"height="' + h + 'px" width="' + w + 'px" scrolling="no"></iframe></a></div>';
				}
				
				listItem.innerHTML = content + '<div class="tileTitle">' + this.projectData[count].name + '</div><div class="tileDate">Last modified: ' + date + '</div>';
				
				this.listNode.lastChild.appendChild( listItem );
			}
		}
		
		ProjectGrid.prototype.showProjectTiles = showProjectTiles;
		
		function showProjectTable(parent, name){
		
			this.tileButton.style.background = 'white';
			this.listButton.style.background = '#E0E0E0';
		
			this.listNode = this.anchorNode.firstChild.lastChild;
			
			var listChild = this.listNode.firstChild;

			while( listChild ) {
			    this.listNode.removeChild( listChild );
			    listChild = this.listNode.firstChild;
			}
		
			var tableTemplate = '<table><th>Project Name</th><th>Description</th><th>Last Modified</th></table>';
			
			this.listNode.innerHTML = tableTemplate;
			
			for( var count = 0; count< this.projectData.length; count++ ){
			
				var row = document.createElement('tr');
				
				var date = this.projectData[count].date.getMonth() + 1 + "." + this.projectData[count].date.getDate() + "." + this.projectData[count].date.getFullYear();
		
				row.innerHTML = '<td>' + this.projectData[count].name + '</td><td>' + this.projectData[count].description + '</td><td>' + date + '</td>';
		
				this.listNode.firstChild.appendChild( row );
			}
		}
		
		ProjectGrid.prototype.showProjectTable = showProjectTable;

		return{
			ProjectGrid:ProjectGrid
		};
	}
);