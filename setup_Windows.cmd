    REM
    REM "installation script for the Zero To Blockchain Series" 
    REM "This is for MS Windows ONLY " 
    REM "The script will then install the nodejs SDK for hyperledger and composer" 
    REM

REM Install the node modules required to work with hyperledger composer
    REM "---> install windows build tools from administrative command prompt FIRST
    REM     npm install --global --production windows-build-tools
    REM "---> install node-gyp from Administrative Command Prompt FIRST"
    REM    npm install -g node-gyp
            REM "----->  The composer-cli contains all the command line operations for developing business networks." 
            npm install -g --python=python2.7 composer-cli
            REM "----->  The generator-hyperledger-composer is a Yeoman plugin that creates bespoke applications for your business network." 
            npm install -g --python=python2.7 generator-hyperledger-composer
            REM "----->  The composer-rest-server uses the Hyperledger Composer LoopBack Connector to connect to a business network, extract the models and then present a page containing the REST APIs that have been generated for the model. 
            npm install -g --python=python2.7 composer-rest-server
            echo c "=====================================================" 
            REM "----->  Yeoman is a tool for generating applications. When combined with the generator-hyperledger-composer component, it can interpret business networks and generate applications based on them." 
            npm install -g --python=python2.7 yo
