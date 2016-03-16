'use strict';

/* 
TODO:
	-minute+hour co-occurence stats
	-weekday+hour co-occurence stats ,not that great for "now" timestamps
	-day of month occurence ,not that great for "now" timestamps
*/
//only do the require thing in node, browser needs to include files individually
if (typeof window == 'undefined'){var utils = require('suddenutils');}
var _ = new utils;
var SuddenStats = function(objConfig){
	//----====|| CONFIG ||====----\\
	//start with some defaults, the global stat will require nuothing but a number passed in an array.
	this.config = {limit:100000,throttle:1000,batch:'or',stats:{primary:{type:'numeric'}}};
	//simple mode is when only the global stat is used and only arrays of numbers are passed in. by setting this once for the object it avoids many typechecks
	this.simple = false;
	this.stats = {};
	this.batch = [];
	this.stats.batchStats = {total:0,last:0,current:0,diff:0,min:0,max:0};
	this.ts = Date.now();
	this.intBatch = 0;
	this.inProcess=false;
	//this.processing = false;
	var objDefaults={},updateStats={},aggStats={},trimStats={},objFilters={};
	 objDefaults.numeric = function(){return {min:0,max:0,avg:0,count:0,total:0,first:false,last:false,lastAvg:false,diff:0,fs:Date.now(),ls:Date.now(),type:'numeric'}; }
	 objDefaults.uniq = function(){return {limit:100,count:0,fs:Date.now(),ls:Date.now(),max:0,total:0,avg:0,values:{}}; }
	 objDefaults.compete = function(){return {limit:100,min:0,max:0,avg:0,count:0,total:0,first:false,last:false,lastAvg:false,diff:0,fs:Date.now(),ls:Date.now(),values:{}};; }
	 objDefaults.co_occurence = function(){return {total:0,limit:100,count:0,max:0,fs:Date.now(),ls:Date.now(),values:{}}; }
	 objDefaults.windows = {minute:60,hour:24,day:7,week:52};

	var self=this;
	//----====|| INIT STATS OBJECTS ||====----\\
	var init = function(objConfig){
		//TODO: validate the structure of config passed in
		//simple mode is only for when there are just arrays of numbers sent, if it's objects cant use simple mode
		if(objConfig && objConfig.stats){ self.config.stats={}; }
		//merge defaults and config provided.
		if(typeof objConfig==='object'){self.config = _.defaults(self.config,objConfig);}
		//create all of the stats properties for what will be tracked
		_.forOwn(self.config.stats,function(objStat,k){
			//console.log('stats loop: ',objV,k);
			initStat(k,objStat);
		});
		//can we go into simple mode? if so it will be much faster, and generic of course
		if(self.stats.primary){ self.simple = true; }
	}

//----====|| Public Functions ||====----\\
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
		//batch by number or time
		var ts=Date.now();
		if(self.config.batch==='or' && self.intBatch>=self.config.limit || ts >= self.ts+self.config.throttle){ runQ(self.batch); }
		if(self.config.batch==='and' && self.intBatch>=self.config.limit && ts >= self.ts+self.config.throttle){ runQ(self.batch); }
	};

	this.addData = function(arrData){
		//EXAMPLE: objStat.addData([1,2,3,4]);
		//flag for if its updating or not, significant for adjusting throttle automatically
		self.inProcess=true;
		//always work with an array of data. Data is expected be in such vlume that it should be buffered into batches
		if(arrData.length===0 && self.batch.length>0){arrData=self.batch;}
		//clear the batch
		self.batch=[]; self.intBatch=0;
		//skip all the extra stuff if it's just numeric.
		if(self.simple===true){ self.stats.primary = updateStats['numeric'](arrData,self.stats.primary); }
		else{
			var arrBatch={};
			_.forOwn(self.config.stats,function(objStat,strStat){
				//init the batch so all we have to do is push.
				arrBatch[strStat]={data:[]};
			});
			//----====|| LOOP THROUGH DATA GIVEN, CREATE STAT BATCHES ||====----\\
			_.forEach(arrData,function(objData,k){
				//----====|| LOOP THROUGH STATS CONFIG ||====----\\
				_.forOwn(self.config.stats,function(objStat,strStat){
					//----====|| FILTER ||====----\\
					var fKeep=true;
					if(objStat.hasOwnProperty('filter')){
						_.for(objStat.filter,function(v,k){
							//pass to a filter function by op with path and val params
							if(fKeep===true){
								fKeep=objFilters[v.op](v.path,v.val,objData,v.and);
							}else{
								//console.log(fKeep);
							}
						});	 
					}
					if(fKeep===true){
						//----====|| UPDATE STAT ||====----\\
						var varValue='';
						switch(objStat.type){
							case 'numeric': varValue = _.get(objData,objStat.path); break;
							case 'uniq': varValue = _.get(objData,objStat.path); break;
							case 'compete': varValue = [_.get(objData,objStat.path),_.get(objData,objStat.score)]; break;
							case 'co_occurence': varValue= _.get(objData,objStat.path)+'_'+_.get(objData,objStat.path2); break;
						}
						//get the numbers from the object based on the path
						if(varValue !== ''){
							if(varValue && varValue.constructor === Array){ _.forEach(varValue,function(v,k){ arrBatch[strStat].data.push(v); }); }
							else{ arrBatch[strStat].data.push( varValue ); }
							//----====|| IMMEDIATE ACTIONS ||====----\\
							if(objStat.hasOwnProperty('act')){ objStat.act(objData); }
						}
					}
				});
			});
			//----====|| PROCESS STATS BATCHES ||====----\\
			_.forOwn(arrBatch,function(objStat,strStat){
				//console.log('process batch loop',objStat,strStat);
				//it ended up being cleaner and faster to have the unfctions in a config array than to have them in a case statement
				//set the existing stat using the config.stat_type function with the given stat from the batch and the key for the stat updating as params
				//if(self.stats[strStat]){
					self.stats[strStat]=updateStats[self.stats[strStat].type](objStat.data,self.stats[strStat]); 
					//----====|| STATS WINDOWS ||====----\\
					if(self.stats[strStat].hasOwnProperty('level')){ 
						updateWindows(objStat.data,self.stats[strStat]); 
					}
					//----====|| STATS TRIM ||====----\\
					var fTrim=false;
					var intLimit = self.stats[strStat].limit;
					if(self.stats[strStat].hasOwnProperty('padding')){ intLimit +=self.stats[strStat].padding; }
					if(self.stats[strStat].hasOwnProperty('limit') && self.stats[strStat].count > intLimit){ 
						if(self.stats[strStat].hasOwnProperty('level') && Object.keys(self.stats[strStat].windows.current.values).length > intLimit){ fTrim=true; }
						else if(Object.keys(self.stats[strStat].values).length > intLimit){ fTrim=true; }
					} 
					if(fTrim===true){ trimStat(self.stats[strStat]); }	
					//reset
					delete arrBatch[strStat];
				//}
			});
		}
		self.inProcess=false;
	};
	this.addStat=function(strStat,objStat){
		self.config.stats[strStat]=objStat;
		initStat(strStat,objStat);
	}
	this.delStat=function(strStat){
		delete self.config.stats[strStat];
		delete self.stats[strStat];
	}
	this.rstStat=function(strStat){
		initStat(strStat,self,stats[strStat]);
	}

//----====|| Internal Functions ||====----\\
	var initStat = function(k,objStat){
		//set defaults for stat
		//add any user overrides to things like type
		self.stats[k] = _.defaults(objStat,objDefaults[objStat.type]());
		//init the windows
		if(objStat.hasOwnProperty('level') && objDefaults.windows.hasOwnProperty(objStat.level)){ 
			self.stats[k].windows={};
			self.stats[k].windows.current = _.defaults({},objDefaults[objStat.type]());
			self.stats[k].windows.minute=[];
			if(self.config.stats[k].level=='hour' || self.config.stats[k].level=='day'){ 
				self.stats[k].windows.hour=[]; 
			}
			if(self.config.stats[k].level=='day'){
				self.stats[k].windows.day=[]; 
			}
		}
		//init the filters
		if(objStat.hasOwnProperty('filter')){
			//always format filters into an array
			if(objStat.filter.constructor !== Array){ objStat.filter=[objStat.filter]; }
			_.for(objStat.filter,function(v,k){
				if(!v.hasOwnProperty('and')){objStat.filter[k].and={}; }
				if(v.hasOwnProperty('val2')){ objStat.filter[k].and.val2=v.val2; delete objStat.filter[k].val2; }
				if(v.hasOwnProperty('path2')){ objStat.filter[k].and.path2=v.path2; delete objStat.filter[k].path2; }
			});	 
		}
	}
	var runQ = function(arrData){
		//just a little helper to qData
		var ts=Date.now();
		//update the batch stats  	this.batchStats = {total:0,last:0,diff:0};
		
		self.stats.batchStats.last = self.stats.batchStats.current;
		self.stats.batchStats.current = arrData.length;
		if(self.stats.batchStats.total===0){self.stats.batchStats.min=self.stats.batchStats.current;}
		self.stats.batchStats.total = self.stats.batchStats.total+self.stats.batchStats.current;
		self.stats.batchStats.diff = self.stats.batchStats.current-self.stats.batchStats.last;
		if(self.stats.batchStats.current< self.stats.batchStats.min){ self.stats.batchStats.min=self.stats.batchStats.current; }
		if(self.stats.batchStats.current> self.stats.batchStats.max){ self.stats.batchStats.max=self.stats.batchStats.current; }

		self.addData(self.batch);
		if(self.inProcess===true){
			//adjust the throttling until runs dont bump into each other
			self.config.limit++; self.config.throttle++;
		}
		//set the new timestamp
		self.ts=ts;
	}

	var trimStat = function(objStat){
		var strKeep="newest";
		if(objStat.hasOwnProperty('keep') && trimStats.hasOwnProperty(strKeep)){ strKeep=objStat.keep; }
		return trimStats[strKeep](objStat);
	}

	var updateWindows = function(arrData, objStat){
		//console.log(arrData,objStat);
		//does a new bucket need to be created?
		//var intNow=Date.now(); //shouldnt be needed, can use ls
		if(objStat.windows.current.fs < objStat.ls-60000 ){
			//take current bucket, snapshot it to history
			objStat.windows.minute.push(objStat.windows.current);
			//re-init current bucket
			objStat.windows.current = _.defaults({},objDefaults[objStat.type]());
			if(objStat.windows.hasOwnProperty('hour') && objStat.windows.ts_hour < objStat.ls-360000){
				//loop through minutes and drop off anything older than an hour
				objStat.windows.minute = _.filterOld(objStat.windows.minute, 'fs', 360000)
				//then take the remaining ones to aggregate into an hour
				objStat.windows.hour.push( aggStats[objStat.type](objStat.windows.minute) );
				objStat.windows.ts_hour = objStat.ls;
			}
			if(objStat.windows.hasOwnProperty('day') && objStat.windows.ts_hour < objStat.ls-86400000){
				//loop through minutes and drop off anything older than an hour
				objStat.windows.hour = _.filterOld(objStat.windows.hour, 'fs', 86400000)
				//then take the remaining ones to aggregate into an hour
				objStat.windows.day.push( aggStats[objStat.type](objStat.windows.hour) );
				objStat.windows.ts_day = objStat.ls;
			}			
		}
		//process current
		objStat.windows.current = updateStats[objStat.type](arrData,objStat.windows.current);
		return objStat;
	}

//----====|| Trims ||====----\\
	trimStats.newest = function(objStat){
		//console.log('trim new:');
		//TODO: remove code repitition
		if(objStat.hasOwnProperty('windows')){
			var i=0,length = Object.keys(objStat.windows.current.values).length;
			while (length-- > objStat.limit){ 
				delete objStat.windows.current.values[Object.keys(objStat.windows.current.values)[i]]; 
				i++;
			}
		}else{
			var i=0,length = Object.keys(objStat.values).length;
			while (length-- > objStat.limit){ 
				delete objStat.values[Object.keys(objStat.values)[i]]; 
				i++;
			}
		}
		return objStat;
	}
	trimStats.newHigh = function(objStat){
		//console.log('trim newHigh:');
		//TODO: remove code repetition
		//TODO: use the position as a factor in deciding to remove even if it's above average
		if(objStat.hasOwnProperty('windows')){
			var i=0,length = Object.keys(objStat.windows.current.values).length;
			while (length > objStat.limit){ 
				if(objStat.windows.current.values[Object.keys(objStat.windows.current.values)[i]] <= objStat.avg){
					delete objStat.windows.current.values[Object.keys(objStat.windows.current.values)[i]]; 
				}
				i++; length--;
			}
		}else{
			var i=0,length = Object.keys(objStat.values).length;
			while (length > objStat.limit){ 
				if(objStat.values[Object.keys(objStat.values)[i]] <= objStat.avg){
					delete objStat.values[Object.keys(objStat.values)[i]];
				}
				i++; length--;
			}
		}
		return objStat;
	}

//----====|| Stats ||====----\\
	updateStats.uniq = function(arrData, objStat){
		//console.log('uniq: ',arrData,objStat);
		var intTotal=0, intCount=0, v;
		_.for(arrData,function(v,k){
			//update values
			if(v===true){v='true';}else if(v===false){v='false';}
			if(objStat.values.hasOwnProperty(v)){ objStat.values[v]++; }
			else{objStat.values[v]=1; intCount++; }
			//update max
			if(objStat.values[v] > objStat.max){objStat.max = objStat.values[v];}
			//add to total
			intTotal++;
			//update avg
			objStat.avg=objStat.total/objStat.count;
		});
		objStat.total += intTotal;
		objStat.count += intCount;
		objStat.ls = Date.now();
		return objStat;
	}

	updateStats.compete = function(arrData, objStat){
		var intCount = 0, intTotal=0, v;
		_.for(arrData,function(v,k){
			if(objStat.values.hasOwnProperty(v[0])){ objStat.values[v[0]]+=v[1]; }
			else{objStat.values[v[0]]=v[1]; intCount++;}
			if(objStat.values[v[0]] > objStat.max){objStat.max = objStat.values[v[0]];}
			intTotal += v[1];
		});
		objStat.count += intCount;
		objStat.total += intTotal;
		objStat.avg=objStat.total/objStat.count;
		objStat.ls = Date.now();
		return objStat;
	}

	updateStats.co_occurence = updateStats.uniq;

	updateStats.numeric = function(arrData, objStat){
		if (!(arrData.constructor === Array)) { arrData = [arrData]; }
		//EXAMPLE: objStat.updateStat([1,2,3,3,4],'primary');
		var intCount = 0,
			intMin=arrData[0],
			intMax=0,
			intSum=0,
			intTotal=0,
			intFirst=arrData[0],
			intLast=arrData[0];
		_.for(arrData,function(v,k){
			if(v<intMin){ intMin=v; }
			if(v>intMax){ intMax=v; }
			intSum += v;
			intFirst = v;
			intCount++;
		});
		var intAvg = intSum/intCount;
		if( intMin < objStat.min || objStat.first===false ){ objStat.min = intMin; }
		if( intMax > objStat.max ){ objStat.max = intMax; }
		objStat.count = objStat.count + intCount;
		objStat.total += intSum;
		
		objStat.last = intLast;
		if( objStat.first===false ){ objStat.first = intFirst; objStat.fs=Date.now(); }
		objStat.ls=Date.now();
		objStat.avg=objStat.total/objStat.count;
		objStat.diff = intAvg-objStat.lastAvg;
		objStat.lastAvg = intAvg;
		return objStat;
	};

//----====|| Aggregates ||====----\\
	aggStats.numeric = function(arrData){
		var objAgg = _.defaults({},objDefaults.numeric);
		_.forEach(arrData,function(v,k){
			if(v.min < objAgg.min){ objAgg.min = v.min; }
			if(v.max > objAgg.max){ objAgg.max = v.max; }
			if(v.fs < objAgg.fs){ objAgg.fs = v.fs; }
			if(v.ls > objAgg.ls){ objAgg.max = v.ls; }
			objAgg.total += v.total;
			objAgg.count += v.count;
		});
		objAgg.avg = objAgg.total/objAgg.count;
		return objAgg;
	}
	aggStats.uniq = function(arrData){
		var objAgg = _.defaults({},objDefaults.uniq)
		,intCount=0;
		_.forEach(arrData,function(v,k){
			//get top level stats
			if(v.fs < objAgg.fs){ objAgg.fs = v.fs; }
			if(v.ls > objAgg.ls){ objAgg.ls = v.ls; }
			objAgg.total += v.total;
			_.for(v.values,function(vv,kk){
				if(objAgg.values.hasOwnproperty(kk)){ objAgg.values[kk] += vv; }
				else{ objAgg.values[kk] = vv; intCount++; }
			});
			objAgg.count = intCount;
		});
		return objAgg;
	}
	aggStats.compete = aggStats.uniq;
	aggStats.co_occurence = aggStats.uniq;

//----====|| FILTERS ||====----\\
	objFilters.in = function(strPath,strNeedle,objStat,objOptions){ 
		var intCount = 0; var v=_.get(objStat,strPath);
		if(objOptions && objOptions.hasOwnProperty('path2')){ strNeedle=_.get(objStat,objOptions.path2); }
		if(v.constructor === Array){v=v.join()}
		intCount = _.strCount(strNeedle,v);
		if(objOptions.reverse === true){  
			//filter out objects that match
			if(intCount===0){ return true; }else{return false;}
		}else{
			//filter out objects that dont match
			if(intCount>0){ return true; }else{return false;}
		}
	};
	objFilters.has = function(strPath,strNeedle,objStat,objOptions){ 
		var intCount = 0; var v=_.get(objStat,strPath);
		if(objOptions && objOptions.hasOwnProperty('path2')){ strNeedle=_.get(objStat,objOptions.path2); }
		if(v.constructor === Array){v=v.join()}
		intCount = _.strCount(strNeedle,v);
		if(objOptions.reverse === true){  
			//filter out objects that match
			if(intCount!==objOptions.val2){ return true; }else{return false;}
		}else{
			//filter out objects that dont match
			if(intCount===objOptions.val2){ return true; }else{return false;}
		}
	};
	objFilters.eq = function(strPath,varValue,objStat,objOptions){
		//console.log(strPath,varValue,objStat,objOptions);
		if(objOptions && objOptions.hasOwnProperty('path2')){ varValue=_.get(objStat,objOptions.path2); }
		if(objOptions && typeof objOptions.reverse !== 'undefined' && objOptions.reverse === true){
			//filter out what does match
			if(varValue !== _.get(objStat,strPath)){ return true; }else{ return false; }
		}else{
		//filter out what doesnt match
			//console.log('val:',varValue,'path:',strPath,'stat:',objStat,'result:',_.get(objStat,strPath));
			if(varValue === _.get(objStat,strPath)){ return true; }else{ return false; }
		}
	};
	objFilters.ni = function(strPath,varValue,objStat,objOptions){ 
		objOptions.reverse=true;
		return objFilters.in(strPath,varValue,objStat,objOptions); 
	}
	objFilters.ne = function(strPath,varValue,objStat,objOptions){ 
		objOptions.reverse=true;
		return objFilters.eq(strPath,varValue,objStat,objOptions); 
	}
	//greater than
	objFilters.gt =function(strPath,varValue,objStat,objOptions){
		if(objOptions && objOptions.hasOwnProperty('path2')){ varValue=_.get(objStat,objOptions.path2); }
		if(objOptions && typeof objOptions.reverse !== 'undefined' && objOptions.reverse === true){
			if(varValue > _.get(objStat,strPath)){ return true; }else{ return false; }
		}
	};
	//less than
	objFilters.lt =function(strPath,varValue,objStat,objOptions){
		if(objOptions && objOptions.hasOwnProperty('path2')){ varValue=_.get(objStat,objOptions.path2); }
		if(objOptions && typeof objOptions.reverse !== 'undefined' && objOptions.reverse === true){
			if(varValue < _.get(objStat,strPath)){ return true; }else{ return false; }
		}
	};

	//run on instatiation
	init(objConfig);
};
if (typeof module !== 'undefined' && module.exports){module.exports = SuddenStats;}