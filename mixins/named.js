/* A mixin for adding a denomination to an object
 * ready to be prototypically added to an object / prototype
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore'
],
function(_) {
	"use strict";


	////////////////////////////////////
	var constants  = {};
	var defaults   = {};
	var exceptions = {};
	var methods    = {};


	////////////////////////////////////
	//constants. = ;


	////////////////////////////////////
	//defaults. = ;
	defaults.denomination_ = "Anonymous";
	methods.initialize_named = function() {
		_.defaults( this, defaults );
	};


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	methods.set_denomination = function(name) {
		this.denomination_ = name;
	};
	methods.get_denomination = function() {
		return this.denomination_;
	};


	////////////////////////////////////
	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);

	var DefinedClass = function OffirmoNamedObject() {
		methods.initialize_named.apply(this, arguments);
	};

	DefinedClass.prototype.constants  = constants;
	DefinedClass.prototype.exceptions = exceptions;
	_.extend(DefinedClass.prototype, methods);


	////////////////////////////////////
	return {
		// objects are created via a factory, more future-proof
		'make_new': function() { return new DefinedClass(); },
		// common use : prototypal inheritance
		// note : extended object still have to call the init function !
		mixin : function(prototype) { _.defaults(prototype, methods); },
		// exposing these allows inheritance
		'constants'  : constants,
		'exceptions' : exceptions,
		'defaults'   : defaults,
		'methods'    : methods
	};
}); // requirejs module
