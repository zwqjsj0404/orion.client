/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define*/
/*jslint newcap:false*/
/**
 * JavaScript 1.6 shim
 */
define('orion/editor/js16shim', [], function() {
	if (typeof Array.prototype.indexOf !== 'function') {
		Array.prototype.indexOf = function(searchElement/*, fromIndex*/) {
			var o = Object(this); // equivalent to new Object(this)
			var len = this.length >>> 0;
			if (len === 0) { return -1; }
			var n;
			if (arguments.length > 1) {
				var number = Number(arguments[1]);
				if (isNaN(number)) { n = 0; }
				else if (number === 0 || number === Infinity || number === -Infinity) { n = 0; }
				else { n = (number < 0 ? -1 : 1) * Math.floor(Math.abs(number)); }
			} else {
				n = 0;
			}
			if (n >= len) { return -1; }
			var k = (n >= 0) ? n : Math.max(len - Math.abs(n), 0);
			for (; k < len; k++) {
				if (k in o && o[k] === searchElement) {
					return k;
				}
			}
			return -1;
		};
	}
});
