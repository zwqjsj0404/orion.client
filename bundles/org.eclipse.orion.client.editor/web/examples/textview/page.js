/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

/*globals define window document setTimeout */

define(["require", 
		"orion/textview/textModel",
		"orion/textview/textView", 
		"orion/textview/rulers",
		"examples/textview/textStyler"],   
 
function(require, mTextModel, mTextView, mRulers, mTextStyler) {

	function addTextView(parent, text) {
		var model = new mTextModel.TextModel(text);
		var options = {
			parent: parent,
			model: model,
			stylesheet:  [
				require.toUrl("orion/textview/textview.css"), 
				require.toUrl("orion/textview/rulers.css"),
				require.toUrl("examples/textview/textstyler.css")
			],	
			readonly: true,
			tabSize: 4
		};
		var view = new mTextView.TextView(options);
		var linesRuler = new mRulers.LineNumberRuler(null, "left", {styleClass: "ruler lines"}, {styleClass: "rulerLines odd"}, {styleClass: "rulerLines even"});
		view.addRuler(linesRuler);
		var styler = new mTextStyler.TextStyler(view, "js");
		styler.setHighlightCaretLine(false);
	}

	function getTextFromElement (element) {
		if (!window.getSelection) {
			return element.innerText || element.textContent;
		}
		var newRange = document.createRange();
		newRange.selectNode(element);
		var selection = window.getSelection();
		var oldRanges = [], i;
		for (i = 0; i < selection.rangeCount; i++) {
			oldRanges.push(selection.getRangeAt(i));
		}
		selection.removeAllRanges();
		selection.addRange(newRange);
		var text = selection.toString();
		selection.removeAllRanges();
		for (i = 0; i < oldRanges.length; i++) {
			selection.addRange(oldRanges[i]);
		}
		return text;
	}

	function findElements() {
//		var elements = document.getElementsByName("orioncode"), element, text;
//		if (elements) {
//			for (var i = 0; i < elements.length; i++) {
//				element = elements[i];
//				text = getTextFromElement(element);
//				addTextView(element, text);
//			}
//		}
		var elements = document.getElementsByTagName("PRE"), element, text;
		if (elements) {
			for (var i = 0; i < elements.length; i++) {
				element = elements[i];
				if (element.getAttribute("name") === "orioncode") {
					text = getTextFromElement(element);
					addTextView(element, text);
				}
			}
		}
	}

	findElements();
});