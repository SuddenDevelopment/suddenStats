var assert        = require("assert");
var should        = require("should");
var SuddenStats   = require("../strings");

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