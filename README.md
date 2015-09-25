# suddenStats
minimal config common statistics

intended for high volume streaming data

a statsistics library will typically require a separate lop through an array of data to get each stat. sudenStats is written to reduce the loops through an array to be as fast as possible and get everything in 1 pass. 

can use these stats to make very fast decisions in app logic, or display constantly changing values.

data can be fed to qData function as often as needed. it will buffer for specified batch time frames, and limit the batch in that timeframe to a defined limit.

the throttle time and buffer size are auto adjusting, but can be given values

references:
http://simplestatistics.org/docs/