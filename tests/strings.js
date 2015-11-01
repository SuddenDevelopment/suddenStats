var assert        = require("assert");
var should        = require("should");
var SuddenStats   = require("../SuddenStats");

describe('test if a substring is in a string', function () {
 it('should return 1', function (done) {
    //test
    var objStats = new SuddenStats();
    var intMatch = objStats.strCount('needle','Find the needle in the haystack',{}); 
    //check
    //console.log(objStats);
   (intMatch).should.be.exactly(1);
   done();
 });
});

describe('get counts for multiple words in a string', function () {
 it('should return 2', function (done) {
    //test
    var objStats = new SuddenStats();
    var objMatches = objStats.strCounts(['needle','haystack'],'Find the needle in the haystack,haystack',{}); 
    //check
    //console.log(objStats);
   (objMatches.haystack).should.be.exactly(2);
   done();
 });
});