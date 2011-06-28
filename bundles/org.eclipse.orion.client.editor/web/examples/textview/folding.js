/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
 
function FoldingModel (model) {
	this._listeners = [];
	this._folds = [];
	this._model = model;
	var _self = this;
	this._model.addListener({
		onChanging: function(text, start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
			start = _self.convertOffsetToView(start);
			_self.onChanging(text, start, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
		},
		onChanged: function(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
			start = _self.convertOffsetToView(start);
			_self.onChanged(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
		}
	})
}
FoldingModel.prototype = {
		addListener: function(listener) {
			this._listeners.push(listener);
		},
		removeListener: function(listener) {
			for (var i = 0; i < this._listeners.length; i++) {
				if (this._listeners[i] === listener) {
					this._listeners.splice(i, 1);
					return;
				}
			}
		},
		getCharCount: function() {
			var count =  this._model.getCharCount();
			return this.convertOffsetToView(count);
		},
		getLine: function(lineIndex, includeDelimiter) {
			lineIndex = this.convertLineIndexToModel(lineIndex);
			var line = this._model.getLine(lineIndex, includeDelimiter);
			return line;
		},
		getLineAtOffset: function(offset) {
			offset = this.convertOffsetToModel(offset);		
			var lineIndex = this._model.getLineAtOffset(offset);
			return this.convertLineIndexToView(lineIndex);
		},
		getLineCount: function() {
			var lineCount = this._model.getLineCount();
			return this.convertLineIndexToView(lineCount);
		},
		getLineDelimiter: function() {
			return this._model.getLineDelimiter();
		},
		getLineEnd: function(lineIndex, includeDelimiter) {
			lineIndex = this.convertLineIndexToModel(lineIndex);
			var offset = this._model.getLineEnd(lineIndex, includeDelimiter);
			return this.convertOffsetToView(offset);
		},
		getLineStart: function(lineIndex) {
			lineIndex = this.convertLineIndexToModel(lineIndex);
			var offset = this._model.getLineStart(lineIndex);
			return this.convertOffsetToView(offset);
		},
		getText: function(start, end) {
			start = this.convertOffsetToModel(start);	
			end = this.convertOffsetToModel(end);	
			return this._model.getText(start, end);
		},
		onChanging: function(text, start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
			for (var i = 0; i < this._listeners.length; i++) {
				var l = this._listeners[i]; 
				if (l && l.onChanging) { 
					l.onChanging(text, start, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
				}
			}
		},
		onChanged: function(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
			for (var i = 0; i < this._listeners.length; i++) {
				var l = this._listeners[i]; 
				if (l && l.onChanged) { 
					l.onChanged(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
				}
			}
		},
		setText: function(text, start, end) {
			start = this.convertOffsetToModel(start);	
			end = this.convertOffsetToModel(end);	
			this._model.setText(text, start, end);
		},
		convertLineIndexToModel: function (lineIndex) {
			var folds = this._folds;
			for (var i = 0; i < folds.length; i++) {
				var fold = folds[i];
				if (fold.lineIndex > lineIndex) break;
				lineIndex += fold.lineCount;
			}
			return lineIndex;
		},
		convertLineIndexToView: function (lineIndex) {
			var folds = this._folds;
			var count = 0;
			for (var i = 0; i < folds.length; i++) {
				var fold = folds[i];
				if (fold.lineIndex > lineIndex) break;
				if (lineIndex < fold.lineIndex + fold.lineCount) return fold.lineIndex - count;
				count += fold.lineCount;
			}
			return lineIndex - count;
		},
		convertOffsetToModel: function (offset) {
			var folds = this._folds;
			for (var i = 0; i < folds.length; i++) {
				var fold = folds[i];
				if (fold.offset > offset) break;
				offset += fold.charCount;
			}
			return offset;
		},
		convertOffsetToView: function (offset) {
			var folds = this._folds;
			var count = 0;
			for (var i = 0; i < folds.length; i++) {
				var fold = folds[i];
				if (fold.offset >= offset) break;
				if (offset < fold.offset + fold.charCount) return fold.offset - count;
				count += fold.charCount;
			}
			return offset - count;
		},
		/*
		 * @param lineIndex relative to view, first line to hide
		 * @param lineCount number of lines to hidde
		 */
		collapse: function(lineIndex, lineCount) {
			//lineCount > 1
			lineIndex = this.convertLineIndexToModel(lineIndex);
			var firstHidden = this._model.getLineStart(lineIndex);
			var lastHidden = this._model.getLineStart(lineIndex + lineCount);
			var charCount = lastHidden - firstHidden;
			
			var folds = this._folds;
			var index = 0;
			while (index < folds.length) {
				if (folds[index].lineIndex > lineIndex) break;
				index++;
			}
			var newFold = {
				lineIndex: lineIndex,//relative to model, first line index hidden
				lineCount: lineCount,
				offset: firstHidden,//relative to model, first offset hidden
				charCount: charCount
			}
			if (index === folds.length) {
				folds.push(newFold);
			} else {
				folds.splice(index, 0, newFold);
			}
			
			//update the view
			var start = this.convertOffsetToView(firstHidden);
			this.onChanging("", start, charCount, 0, lineCount, 0);
			this.onChanged(start, charCount, 0, lineCount, 0);
		},
		/* 
		 * @param lineIndex relative to view
		 */
		expand: function(lineIndex) {
			// Intentionally commented out
			// Need to convert the line index in the fold to the view instead.
			// This line index maps to the "gap"
			// lineIndex = this.convertLineIndexToModel(lineIndex);
			var index = 0;
			var folds = this._folds;
			while (index < folds.length) {
				var foldLineIndex = this.convertLineIndexToView(folds[index].lineIndex);
				if (foldLineIndex === lineIndex) break;
				index++;
			}
			if (index === folds.length) return; //invalid lineIndex
			var fold = folds[index]
			var text = this._model.getText(fold.offset, fold.offset + fold.charCount);
			folds.splice(index, 1);
			
			//update the view
			var start = this.convertOffsetToView(fold.offset);
			this.onChanging(text, start, 0, fold.charCount, 0, fold.lineCount);
			this.onChanged(start, 0, fold.charCount, 0, fold.lineCount);
		}
}

function Folding (view, styler) {
	this.view = view;
	this.model = new FoldingModel (view.getModel());
	view.setModel(this.model);
	
	//add ruler
	var expand = {
		html: "<img src='images/add_obj.gif'></img>",
		expand: true
	};
	var collapse = {
		html: "<img src='images/remove_correction.gif'></img>",
		expand: false
	};
	var annotation = new orion.textview.AnnotationRuler("left", {styleClass: "ruler_annotation"}, expand);
	view.addRuler(annotation);

	function addAnnotations() {
		ruler.clearAnnotations();
	}

//	var lineCount = this.model.getLineCount();
//	for (var i =0; i<lineCount;i++) {
//		if (this.model.getLine(i).indexOf("{") !== -1) {
//			ruler.setAnnotation(i, ruler.collapse);
//		}
//	}
//	annotation.onClick =  function(lineIndex, e) {
//		if (lineIndex === undefined) { return; }
//		var a = annotation.getAnnotation(lineIndex);
//		if (a) {
//			if (a.expand) {
//				annotation.setAnnotation(lineIndex, collapse);
//				model.expand(lineIndex + 1);
//				log ("expanding", lineIndex + 1);
//			} else {
//				annotation.setAnnotation(lineIndex, expand);
//				model.collapse(lineIndex + 1, 4);
//				log ("collpasing", lineIndex + 1, 4);
//			}
//		}
//	}
}



function foldingTest() {

	//setup	
	var text = [];
	text.push("line0-0\n");//8 chars per line
	text.push("line1-1\n");
	text.push("line2-2\n");
	text.push("fold0-3\n");
	text.push("fold1-4\n");
	text.push("fold2-5\n");
	text.push("fold3-6\n");//4x3=32 hidden chars
	text.push("line3-7\n");
	text.push("line4-8\n");
	text.push("line5-9\n");
	text.push("line6-0\n");
	text.push("line7-1\n");
	text.push("line8-2\n");	
	text.push("line9-3"); //char count 111 (13*8+7)
	var textModel = new orion.textview.TextModel(text.join(""), "\n");
	var foldModel = new FoldingModel(textModel);
	
	//hack
	function assertEquals (msg, actual, expected) {
		if (expected !== actual) {
			log ("Error at: ", msg, "expected: ", expected, " but ", actual, " was found");
		} else {
			log ("Test ", msg, " passed");
		}
	}
	
	//testing equality between both models
	assertEquals("1", foldModel.getLineCount(), textModel.getLineCount());
	assertEquals("2", foldModel.getCharCount(), textModel.getCharCount());
	var lineIndex, textIndex;
	for(lineIndex=0; lineIndex<foldModel.getLineCount(); lineIndex++) {
		assertEquals("4-"+lineIndex, foldModel.getLine(lineIndex), textModel.getLine(lineIndex));
		assertEquals("5-"+lineIndex, foldModel.getLineStart(lineIndex), textModel.getLineStart(lineIndex));
		assertEquals("6-"+lineIndex, foldModel.getLineEnd(lineIndex), textModel.getLineEnd(lineIndex));
	}
	for(var offset=0; offset<foldModel.getLineCount(); offset++) {
		assertEquals("7-"+offset, foldModel.getLineAtOffset(offset), textModel.getLineAtOffset(offset));
		assertEquals("8-"+offset, foldModel.getText(offset, offset + 1), textModel.getText(offset, offset + 1));
	}
	
	//
	var collpaseIndex = 3;
	var hiddenLines = 4;
	var firstHiddenOffset = textModel.getLineStart(collpaseIndex);
	var lastHiddenOffset = textModel.getLineStart(collpaseIndex + hiddenLines);
	var hiddenOffsets = lastHiddenOffset - firstHiddenOffset;//111-32=79

	
	var listener0 = {
		onChanging: function(text, start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
			assertEquals("onChanging-1", text, "");
			assertEquals("onChanging-2", start, firstHiddenOffset);
			assertEquals("onChanging-3", removedCharCount, hiddenOffsets);
			assertEquals("onChanging-4", addedCharCount, 0);
			assertEquals("onChanging-5", removedLineCount, hiddenLines);
			assertEquals("onChanging-6", addedLineCount, 0);
		},
		onChanged: function(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
			assertEquals("onChanged-1", start, firstHiddenOffset);
			assertEquals("onChanged-2", removedCharCount, hiddenOffsets);
			assertEquals("onChanged-3", addedCharCount, 0);
			assertEquals("onChanged-4", removedLineCount, hiddenLines);
			assertEquals("onChanged-5", addedLineCount, 0);
		}
	
	};
	
	//collapsing
	foldModel.addListener(listener0);
	foldModel.collapse(collpaseIndex, hiddenLines);
	foldModel.removeListener(listener0);

	//Tests	
	assertEquals("1a", foldModel.getLineCount(), textModel.getLineCount() - hiddenLines);
	assertEquals("2a", foldModel.getCharCount(), textModel.getCharCount() - hiddenOffsets);
	assertEquals("3a", foldModel.getLine(collpaseIndex + 1), textModel.getLine(collpaseIndex + hiddenLines + 1));
	for(lineIndex=0; lineIndex<foldModel.getLineCount(); lineIndex++) {
		textIndex = lineIndex;
		if (textIndex>=collpaseIndex) textIndex += hiddenLines;
		assertEquals("4a-"+lineIndex, foldModel.getLine(lineIndex), textModel.getLine(textIndex));
		//only true because fold lines and normal lines have the same length
		assertEquals("5a-"+lineIndex, foldModel.getLineStart(lineIndex), textModel.getLineStart(lineIndex));
		assertEquals("6a-"+lineIndex, foldModel.getLineEnd(lineIndex), textModel.getLineEnd(lineIndex));
	}
	lineIndex = collpaseIndex + hiddenLines;
	var text0 = textModel.getText(textModel.getLineStart(lineIndex), textModel.getLineEnd(lineIndex));//line3-7
	lineIndex = collpaseIndex;
	var text1 = foldModel.getText(foldModel.getLineStart(lineIndex), foldModel.getLineEnd(lineIndex));
	assertEquals("7a", text1, text0);
	
	lineIndex = foldModel.getLineAtOffset(foldModel.getLineStart(collpaseIndex)) + hiddenLines;
	textIndex = textModel.getLineAtOffset(textModel.getLineStart(collpaseIndex) + hiddenOffsets);
	assertEquals("8a", textIndex, lineIndex);
		
	text0 = "Hi";
	lineIndex = foldModel.getLineCount() - 1;
	foldModel.setText(text0, foldModel.getLineStart(lineIndex), foldModel.getLineEnd(lineIndex));
	assertEquals("9a", text0, foldModel.getText(foldModel.getLineStart(lineIndex), foldModel.getLineEnd(lineIndex)));
	lineIndex = textModel.getLineCount() - 1;
	assertEquals("9a", text0, textModel.getText(textModel.getLineStart(lineIndex), textModel.getLineEnd(lineIndex)));
		
	var listener2 = {
		onChanging: function(text, start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
			assertEquals("onChanging-a1", text, textModel.getText(firstHiddenOffset, lastHiddenOffset));
			assertEquals("onChanging-a2", start, firstHiddenOffset);
			assertEquals("onChanging-a3", removedCharCount, 0);
			assertEquals("onChanging-a4", addedCharCount, hiddenOffsets);
			assertEquals("onChanging-a5", removedLineCount, 0);
			assertEquals("onChanging-a6", addedLineCount, hiddenLines);
		},
		onChanged: function(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
			assertEquals("onChanged-a1", start, firstHiddenOffset);
			assertEquals("onChanged-a2", removedCharCount, 0);
			assertEquals("onChanged-a3", addedCharCount, hiddenOffsets);
			assertEquals("onChanged-a4", removedLineCount, 0);
			assertEquals("onChanged-a5", addedLineCount, hiddenLines);
		}
	};
	//Expanding
	foldModel.addListener(listener2);
	foldModel.expand(collpaseIndex);
	foldModel.removeListener(listener2);	
		
	//testing equality between both models after collpase / expand
	assertEquals("1b", foldModel.getLineCount(), textModel.getLineCount());
	assertEquals("2b", foldModel.getCharCount(), textModel.getCharCount());
	var lineIndex, textIndex;
	for(lineIndex=0; lineIndex<foldModel.getLineCount(); lineIndex++) {
		assertEquals("4b-"+lineIndex, foldModel.getLine(lineIndex), textModel.getLine(lineIndex));
		assertEquals("5b-"+lineIndex, foldModel.getLineStart(lineIndex), textModel.getLineStart(lineIndex));
		assertEquals("6b-"+lineIndex, foldModel.getLineEnd(lineIndex), textModel.getLineEnd(lineIndex));
	}
	for(var offset=0; offset<foldModel.getLineCount(); offset++) {
		assertEquals("7b-"+offset, foldModel.getLineAtOffset(offset), textModel.getLineAtOffset(offset));
		assertEquals("8b-"+offset, foldModel.getText(offset, offset + 1), textModel.getText(offset, offset + 1));
	}
	
		
	if (!view) {
		var stylesheets = [
			"/orion/textview/textview.css",
			"/orion/textview/rulers.css",
			"/examples/textview/textstyler.css"
		];
		var options = {
			parent: "divParent",
			model: foldModel,
			stylesheet: stylesheets,
			tabSize: 4,
		};
		var view = new orion.textview.TextView(options);	
	}
	
}
