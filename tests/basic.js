var assert        = require("assert");
var should        = require("should");
var SuddenStats   = require("../SuddenStats");

describe('basic SuddenStats instance', function () {
 it('should return an object', function (done) {
    var objStats = new SuddenStats();
   (typeof objStats).should.equal('object');
   done();
 });
});

describe('basic SuddenStats instance 2', function () {
 it('should return max=6', function (done) {
    //test


    var objStats = new SuddenStats();
    objStats.addData([1,2,3,4,5,6]);
    
    //check
   (objStats.stats.primary.max).should.be.exactly(6);
   done();
 });
});