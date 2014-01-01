/* An enhanced 'base' Backbone model
 * with all available offirmo enhancements.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'backbone',
	'base-objects/backbone/extensible_model',
	'base-objects/backbone/enhanced_change_monitor_mixin',
	'base-objects/backbone/sync_api_uniformization_mixin'
],
function(_, Backbone, ExtensibleModel, BBEnhancedChangeMonitorMixin, BBSyncAPIUniformizationMixin) {
	"use strict";

	var BaseModel = ExtensibleModel.extend({});
	BBEnhancedChangeMonitorMixin.mixin(BaseModel.prototype);
	BBSyncAPIUniformizationMixin.mixin(BaseModel.prototype);

	return BaseModel;
}); // requirejs module
