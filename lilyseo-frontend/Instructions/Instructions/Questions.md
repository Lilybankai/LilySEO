For the Puppeteer crawler:
Do you want to limit the crawl depth (number of pages) per domain? We want to limit free users to crawling site 50 pages long pro and eneterprise have no crawl limits we only want free users to crawl there sites once a month in call frequency settins pro and enterprise users can crawl weekly or daily tho in the options we also want to make sure free users can only create 3 projects any more than 3 they need a prompt telling them that they need to upgrade to a paid account 

Should we respect robots.txt and crawl-delay directives? yes i think we should shouldnt we ?


Do we need to handle JavaScript-rendered content? Im unsure all i know is this i need the crawl to be comprehensive so that when we generate the audit where saying ok these are the issues for example home page meta title too long this is what the title is currently oh i have alt tags missing on images ok well what image am i looking for 

For the Google PageSpeed Insights integration:
Do you have an API key for PageSpeed Insights? i do have a api key yes its here AIzaSyBtvQHoTERui23nndYVHZxws83C2UysMhg
Should we implement rate limiting for API calls? i dont think we need to 



Do you want to cache results for a certain period? I think we should yes 

For the Moz API integration:
Do you have Moz API credentials? i do here is the api key bW96c2NhcGUtNFU4SW1IRlRpMzpla09Yenpoc1RWbFpLVGE5M2dOVXhoVHJXa3dvOTJiTQ==
Which specific Moz metrics do you want to track? we only want to track domain authority score and the top ten backilinks in the audit report 


Should we implement daily/monthly API usage limits? ermmm i dont think we need to i think we need to restrict moz slightly due to cost im open to this tho 

For the AI recommendations:
Which AI model would you prefer to use (e.g., OpenAI, Claude, etc.)?
I want to use claude and open ai we will be using azure for open ai 
Should recommendations be generated in real-time or asynchronously?  Recmmendations should be generated after the audit and all the api calls have been made 
What specific aspects should the AI focus on (e.g., content, technical SEO, backlinks)? The whole idea is to provde ai insights that are actianable and well expolained if there site is slow lets tell them how to improve it i want to idealy have a cms checker where it finds out there cms and then the ai can gove advice based on the CMS it could quote plugins etc to use it could tell them how to increase backlinks etc we will need to tell the ai what format we want the data so it matches what your trying to show in the audit it that makes sense 

For the Google My Business integration: I actually ment google search console now with this i wanna include google search console metrics in the audit but then i also wanna add a seperate page in the sidebar specificaly for google search console where we display there orgnaic performance search terms etc but so that we also show how many pages are indexed and what that means and im hoping we might be able to allow them to send pages for indexing some how for this youll need to set up google auth so that they can sign in to gogole and link there searc console profile 

How frequently should we sync google search console should be fethched ones every 24 hours 