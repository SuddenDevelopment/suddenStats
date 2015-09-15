
// stats->stat->
// add stat, wipe stats, update stat
// min, max, avg, last, first, count, total
// start stop
// stats windows
// limits on windows, limits on stats 
// key, value unique, values

//Why? because stats like .min and .max need to be run over an entire array each time, these stay up to date. normally it's cheap to just dump into an array and run min and max etc when you need them, but in some cases min and max are neded to determine what to do often.

/* 
everything is optional!
objConfig={  
	 limit: 1000
	,stats:
		{
			 key:{
				 path:'path of key within an object'
				,type:'numeric, uniq, freq, co-occurence'
				,values:{starting values
			 }
		}
}
*/
var _ = require('lodash');
var suddenStats = function(objConfig){
	//start with some defaults, the global stat will require nuothing but a number passed in an array.
	this.config = {limit:10000,stats:{primary:{type:'numeric'}}}
	//simple mode is when only the global stat is used and only arrays of numbers are passed in. by setting this once for the object it avoids many typechecks
	this.simple = false;
	this.stats = {};

	this.init(objConfig);

	this.init = function(objConfig){
		//TODO: validate the structure of config passed in
		//TODO: consider using _.defaultsDeep instead
		//merge defaults and config provided.
		this.config = _.merge(this.config,objConfig);
		//create all of the stats properties for what will be tracked
		_.forOwn(this.config.stats,function(objV,k){
			//set defaults for stat
			this.stats[k] = {min:0,max:0,avg:0,count:0,total:0,first:false,last:false,fs:Date.now(),ls:Date.now(),type:'numeric'};
			//add any user overrides to things like type
			_.merge(this.stats[k],objV);
		});
		//can we go into simple mode? if so it will be much faster, and generic of course
		if(_.keys(this.stats)==1 && this.stats.hasOwnProperty('primary')){ this.simple = true; }
	}

	this.addData = function(arrData){
		//always work with an array of data. Data is expected be in such vlume that it should be buffered into batches
		if(this.simple){ this.updateStat(arrData,'primary'); }
		else{ this.addCustomData(arrData);
			var arrBatch={};
				_.forOwn(this.config.stats,function(objStat,strStat){
					//init the batch so all we have to do is push.
					arrBatch[strStat].data = [];
				});
			//data loop
			_.forEach(arrData,function(objData,k){
				//stats loop
				_.forOwn(this.config.stats,function(objStat,strStat){
					//get the numbers from the object based on the path
					arrBatch[strStat].data.push( _.get(objData,objStat.path); );
				});
			});
			_.forOwn(arrBatch,function(objStat,strStat){
				//init the batch so all we have to do is push.
				this.updateStat(objStat.data,arrBatch[strStat]);
			});
		}
	};

	this.updateStat = function(arrData,key){
		//these are light, but do them as little as necessary
		var intMin = _.min(arrData);
		var intMax = _.max(arrData);
		if( intMin < this.stats.[key].min ){ this.stats.[key].min = intMin; }
		if( intMax > this.stat.[key] ){ this.stats.[key].max = intMax; }
		this.stats.[key].count = this.stats.[key].count + arrData.length;
		this.stats.[key].total = this.stats.[key].total + _.sum(arrData);
		this.stats.[key].last = _.last(arrData);
		if( this.stats.[key].first===false ){ this.stats.[key].first = _.first(arrData); this.stats.[key].fs:Date.now(); }
		this.stats.[key].ls=Date.now();
		this.stats.[key].avg=this.stats.[key].total/this.stats.[key].count;
	}

};