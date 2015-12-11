# suddenStats
minimal config common statistics

intended for high volume streaming data

a statsistics library will typically require a separate lop through an array of data to get each stat. sudenStats is written to reduce the loops through an array to be as fast as possible and get everything in 1 pass. 

can use these stats to make very fast decisions in app logic, or display constantly changing values.

## Features
- fast generic numeric statstics
- get stats on unique values, and unique combinations, and unique values + numeric stats
- batching, with auto throttling
- rolling time windows
- auto aggregation of time windows
- in line filters, get stats for subsets
- works in node and browser

##QuickStart:

for node: 
```
npm install suddenstats --save
```
or

browser: 
```
bower install suddenstats --save
```

look at the tests and the demo. The demo can run in a browser

##node include
```
var SuddenStats = require('suddenstats');
```

##browser include
```
<script src="bower_components/suddenstats/utils.js"></script>
<script src="bower_components/suddenstats/SuddenStats.js"></script>
```

##API
- qData(dataObject) : put the data in a small buffer to be batched for efficiency
- addData(dataObject) : apply data immediately

##Configuring Stats

###Statistics Types
- numeric: pure numerical stats
- uniq: unique value counts, gives each unique value and count
- compete: unique value + numeric stats, will give you each unique value + numeric statistics (not just counts)
- co-occurence: 2 value combination counts, same as unique but works for unique combinations. value1_value2

###Windows: defined by "level" param
- minute, keep up to 60 minute windows
- hour, keep 60 minute windows, automatically aggregate them into hourly windows
- day, 60 minute windows, 24 hourly windows, daily windows.

###Filters:
- eq: exact matches
- in: substring or item in array match
- gt: greater than
- lt: less than