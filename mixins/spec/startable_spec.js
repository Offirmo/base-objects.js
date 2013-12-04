if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'base-objects/mixins/startable',
	'mocha'
],
function(chai, CUT) {
	"use strict";

	var expect = chai.expect;
	chai.should();


	describe('[Mixin] Startable', function() {

		describe('standalone', function() {
			describe('instantiation', function() {

				it('should work', function() {
					var out = CUT.make_new();
					out.should.exist;
					out.should.be.an('object');
				});

				it('should set default values', function() {
					var out = CUT.make_new();
					out.is_started().should.be.false;
				});

			}); // describe feature

			describe('startup / shutdown', function() {

				it('should work', function() {
					var out = CUT.make_new();

					out.is_started().should.be.false;
					out.startup();
					out.is_started().should.be.true;
					out.shutdown();
					out.is_started().should.be.false;
				});

			}); // describe feature
		}); // describe feature


		function CUTmixed() {
			this.initialize_startable.apply(this, arguments);
		}
		CUT.mixin(CUTmixed.prototype);

		describe('mixed', function() {
			describe('instantiation', function() {

				it('should work', function() {
					var out = new CUTmixed();
					out.should.exist;
					out.should.be.an('object');
				});

				it('should set default values', function() {
					var out = new CUTmixed();
					out.is_started().should.be.false;
				});

			}); // describe feature

			describe('startup / shutdown', function() {

				it('should work', function() {
					var out = new CUTmixed();

					out.is_started().should.be.false;
					out.startup();
					out.is_started().should.be.true;
					out.shutdown();
					out.is_started().should.be.false;
				});

			}); // describe feature
		}); // describe feature

	}); // describe CUT
}); // requirejs module
