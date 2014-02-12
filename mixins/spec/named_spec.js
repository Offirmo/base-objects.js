if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'base-objects/mixins/named',
	'mocha'
],
function(chai, CUT) {
	"use strict";

	var expect = chai.expect;
	chai.should();


	describe('[Mixin] Named', function() {

		describe('standalone', function() {
			describe('instantiation', function() {

				it('should work', function() {
					var out = CUT.make_new();
					out.should.exist;
					out.should.be.an('object');
				});

				it('should set default values', function() {
					var out = CUT.make_new();
					out.get_denomination().should.equals("Anonymous");
				});

			}); // describe feature

			describe('name manipulation', function() {

				it('should work', function() {
					var out = CUT.make_new();

					out.get_denomination().should.equals("Anonymous");
					out.set_denomination("toto");
					out.get_denomination().should.equals("toto");
				});

			}); // describe feature
		}); // describe feature


		function CUTmixed() {
			this.initialize_named.apply(this, arguments);
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
					out.get_denomination().should.equals("Anonymous");
				});

			}); // describe feature

			describe('name manipulation', function() {

				it('should work', function() {
					var out = new CUTmixed();

					out.get_denomination().should.equals("Anonymous");
					out.set_denomination("toto");
					out.get_denomination().should.equals("toto");
				});

			}); // describe feature
		}); // describe feature

	}); // describe CUT
}); // requirejs module
