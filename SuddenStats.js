'use strict';
// add stat, wipe stats, update stat
// stats windows
// limits on windows, limits on stats 

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

stat types:
  numeric=min,max,avg, etc.
  uniq=value,count (also with substring search support)
  compete=uniq+numeric (also with substring search support)
  co-occurence=2 coinciding values count (also with substring search support)

TODO: move vars to private-ish like default configs

*/
var _ = require('lodash');
var SuddenStats = function(objConfig){
	//start with some defaults, the global stat will require nuothing but a number passed in an array.
	this.config = {limit:1000,throttle:1000,stats:{primary:{type:'numeric'}}};
	//simple mode is when only the global stat is used and only arrays of numbers are passed in. by setting this once for the object it avoids many typechecks
	this.simple = false;
	this.stats = {};
	this.batch = [];
	this.intBatch = 0;
	//this.processing = false;
	this.objNumericDefaults = {min:0,max:0,avg:0,count:0,total:0,first:false,last:false,lastAvg:false,diff:0,fs:Date.now(),ls:Date.now(),type:'numeric'};
	this.objUniqDefaults = {limit:100,count:0,fs:Date.now(),ls:Date.now(),values:{}};
	this.objCompeteDefaults = {limit:100,min:0,max:0,avg:0,count:0,total:0,first:false,last:false,lastAvg:false,diff:0,fs:Date.now(),ls:Date.now(),values:{}};;
	var self=this;
/*
 source:{type:"uniq",path:"source"}
      ,user:{type:"compete",path:"user",score:"score"}
      ,user_source:{type:"co-occurence",path1:"user",path2:"source"}
      ,score:{type:"numeric",path:"score"}
    });
    */
	this.init = function(objConfig){
		//TODO: validate the structure of config passed in
		//TODO: consider using _.defaultsDeep instead
		//simple mode is only for when there are just arrays of numbers sent, if it's objects cant use simple mode
		if(objConfig && objConfig.stats){ self.config.stats={}; }
		//merge defaults and config provided.
		self.config = _.merge(self.config,objConfig);
		//create all of the stats properties for what will be tracked
		_.forOwn(self.config.stats,function(objV,k){
			//set defaults for stat
			//add any user overrides to things like type
			switch(objV.type){
				case 'numeric':
					self.stats[k] = _.merge(self.objNumericDefaults,objV);
					break;
				case 'uniq':
					self.stats[k] = _.merge(self.objUniqDefaults,objV);
					break;
				case 'compete':
					self.stats[k] = _.merge(self.objCompeteDefaults,objV);
					break;
				case 'co-occurence':
					self.stats[k] = _.merge(self.objUniqDefaults,objV);
					break;
			}
		});
		//can we go into simple mode? if so it will be much faster, and generic of course
		if(self.stats.primary){ self.simple = true; }
	}

	this.init(objConfig);

	this.qData = function(varData){
		//EXAMPLE: objStat.qData([1,2,3,4]);
		//add data as often as you want, but batch it by time, using the deboucne config, defined in miliseconds
		//config.limit is to start kciking things out of the batch after too many per batch / time period
		
			if(Array.isArray(varData)){  
				//combine batches or arrays into the throttle timeline
				var v;
				self.intBatch=self.intBatch = self.intBatch+varData.length;
				while(v=varData.pop()){ self.batch.push(v); }
			}else{
				//for individual entries
				self.intBatch=self.intBatch+1;
				self.batch.push(varData);
			}
			/* 
			if(fnInprocess){ 
				if(self.config.limit > 2){self.config.limit--;} 
				self.config.throttle++;
			}
			*/
		if(self.intBatch>=self.config.limit){ this.addData(self.batch); }
		//this.runQ(self.batch);
	};
/*
 source:{type:"uniq",path:"source"}
      ,user:{type:"compete",path:"user",score:"score"}
      ,user_source:{type:"co-occurence",path1:"user",path2:"source"}
      ,score:{type:"numeric",path:"score"}
    });
    */
	this.addData = function(arrData){
		//EXAMPLE: objStat.addData([1,2,3,4]);
		//always work with an array of data. Data is expected be in such vlume that it should be buffered into batches
		if(arrData.length===0 && self.batch.length>0){arrData=self.batch;}
		//clear the batch
		self.batch=[]; self.intBatch=0;
		if(self.simple===true){ self.updateStat(arrData,'primary'); }
		else{
			var arrBatch={};
				_.forOwn(self.config.stats,function(objStat,strStat){
					//init the batch so all we have to do is push.
					arrBatch[strStat]={data:[]};
				});
			//data loop
			_.forEach(arrData,function(objData,k){
				//stats loop
				_.forOwn(self.config.stats,function(objStat,strStat){
					var varValue;
					if(objStat.type==='co-occurence'){  }
					else{  }
					switch(objStat.type){
						case 'numeric':
							varValue = _.get(objData,objStat.path);
							break;
						case 'uniq':
							varValue = _.get(objData,objStat.path);
							break;
						case 'compete':
							varValue = [_.get(objData,objStat.path),_.get(objData,objStat.score)];
							break;
						case 'co-occurence':
							//co-occurnce has 2 paths
							varValue= _.get(objData,objStat.path)+'_'+_.get(objData,objStat.path2);
							break;
					}
					//get the numbers from the object based on the path
					arrBatch[strStat].data.push( varValue );
				});
			});
			_.forOwn(arrBatch,function(objStat,strStat){
				console.log(strStat);
				switch(self.stats[strStat].type){
					case 'numeric':
						self.updateStat(objStat.data,strStat);
						break;
					case 'uniq':
						self.updateStat_uniq(objStat.data,strStat);
						break;
					case 'compete':
						self.updateStat_compete(objStat.data,strStat);
						break;
					case 'co-occurence':
						self.updateStat_uniq(objStat.data,strStat);
						break;
				}
			});
		}
	};


	this.runQ = _.throttle(this.addData,self.config.throttle);

	this.updateStat_uniq = function(arrData, key){
		//console.log(arrData);
		var intCount = 1;
		var v;
		while(v=arrData.pop()){
			if(self.stats[key].values.hasOwnProperty(v)){ self.stats[key].values[v]++; }
			else{self.stats[key].values[v]=1;}
			intCount = ((intCount | 1) + 1) | 1;
		}
		self.stats[key].count += intCount;
	}

	this.updateStat_compete = function(arrData, key){
		var intCount = 1;
		var v;
		while(v=arrData.pop()){
			if(self.stats[key].values.hasOwnProperty(v)){ self.stats[key].values[v]++; }
			else{self.stats[key].values[v]=self.objCompeteDefaults;}
			intCount = ((intCount | 1) + 1) | 1;
		}
		self.stats[key].count += intCount;
	}

	this.updateStat = function(arrData, key){
		if (!(arrData instanceof Array)) {
			arrData = [arrData];
		}
		//EXAMPLE: objStat.updateStat([1,2,3,3,4],'primary');
		//console.log(this.stats);
		var intCount = 0;		
		//remember pop is backwards but fast https://jsperf.com/fastest-array-loops-in-javascript/401
		//only run through the array once :)
		var v;
		while(v=arrData.pop()){
			if(intCount===0){ 
				var intMin = v; 
				var intMax = v;
				var intSum = v;
				var intAvg = v;
				var intFirst = v;
				var intLast = v; 
			}
			else{
				if(v<intMin){ intMin=v; }
				if(v>intMax){ intMax=v; }
				intSum = intSum+v;
				intFirst = v;
			}
			intCount++;
		}
		var intAvg = intSum/intCount;
		if( intMin < self.stats[key].min || self.stats[key].first===false ){ self.stats[key].min = intMin; }
		if( intMax > self.stats[key].max ){ self.stats[key].max = intMax; }
		self.stats[key].count = self.stats[key].count + intCount;
		self.stats[key].total = self.stats[key].total + intSum;
		self.stats[key].last = intLast;
		if( self.stats[key].first===false ){ self.stats[key].first = intFirst; self.stats[key].fs=Date.now(); }
		self.stats[key].ls=Date.now();
		self.stats[key].avg=self.stats[key].total/self.stats[key].count;
		self.stats[key].diff = intAvg-self.stats[key].lastAvg;
		self.stats[key].lastAvg = intAvg;
	};
};
module.exports = SuddenStats;