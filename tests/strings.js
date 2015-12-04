var assert        = require("assert");
var should        = require("should");
var SuddenStats   = require("../suddenstats");

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

describe('filter out by match', function () {
 it('shoudld return false', function (done) {
    //test
    var objStats = new SuddenStats();
    var objOut = {id:'me',content:'notpoxy'};
    var objMatches = objStats.filter.eq('content','[[WP:OP|open proxy]]',objOut);
    //check
    //console.log(objStats);
   (objMatches).should.be.exactly(false);
   done();
 });
});

describe('filter in by match', function () {
 it('shoudld return object', function (done) {
    //test
    var objStats = new SuddenStats();
    var objOut = {id:'me',content:'[[WP:OP|open proxy]]'};
    var objMatches = objStats.filter.eq('content','[[WP:OP|open proxy]]',objOut);
    //check
    //console.log(objStats);
   (objMatches.id).should.be.exactly('me');
   done();
 });
});