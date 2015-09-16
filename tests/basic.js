var assert        = require("assert");
var should        = require("should");
var SuddenStats   = require("../SuddenStats");

console.log(SuddenStats);

describe('basic SuddenStats instance', function () {
 it('should return an object', function (done) {
    var suddenStats = new SuddenStats();
   (typeof suddenStats).should.equal('object');
   done();
 });
});