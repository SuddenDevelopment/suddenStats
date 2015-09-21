var assert        = require("assert");
var should        = require("should");
var SuddenStats   = require("../SuddenStats");

describe('get a basic stat', function () {
 it('should return max=6', function (done) {
    //test
    var objStats = new SuddenStats();
    objStats.addData([1,2,3,4,5,6]); 
    //check
    //console.log(objStats);
   (objStats.stats.primary.max).should.be.exactly(6);
   done();
 });
});

describe('get a diff between stat batches', function () {
 it('should return diff=13.5', function (done) {
    //test
    var objStats = new SuddenStats();
    objStats.addData([1,2,3,4,5,6]); 
    objStats.addData([15,16,17,18,19,]);
    //check
    //console.log(objStats);
   (objStats.stats.primary.diff).should.be.exactly(13.5);
   done();
 });
});

/* 0.064 using lodash */
/* 0.027 using array.pop */
describe('performance test', function () {
 it('target is 50k/second', function (done) {
    //test
    var objStats = new SuddenStats();
    var intStart= Date.now();
    for(var i=0;i<100000;i++){ objStats.addData([1,2,3,4,5,6]); }
    var intEnd= Date.now();
	var intDuration= (intEnd-intStart)/1000;
    //check
     //console.log(intDuration);
   (intDuration).should.be.below(2);
   done();
 });
});

describe('batch test', function () {
 it('expecting batch limit to get processed and the leftover to be in an unprocessed batch', function (done) {
    //test
    var objStats = new SuddenStats();
    var intStart= Date.now();
    for(var i=1;i<=1001;i++){ objStats.qData(i); }
    var intEnd= Date.now();
	var intDuration= (intEnd-intStart)/1000;
    //check
     //console.log(objStats.stats);
     //console.log(objStats.intBatch);
   (objStats.stats.primary.count).should.be.exactly(1000);
   (objStats.intBatch).should.be.exactly(1);
   done();
 });
});