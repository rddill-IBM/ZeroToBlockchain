   #!/bin/bash
   
    YELLOW='\033[1;33m'
 RED='\033[1;31m'
 GREEN='\033[1;32m'
 RESET='\033[0m'

# indent text on echo
function indent() {
  c='s/^/       /'
  case $(uname) in
    Darwin) sed -l "$c";;
    *)      sed -u "$c";;
  esac
}

# Grab the current directory
function getCurrent() 
    {
        showStep "getting current directory"
        DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
        THIS_SCRIPT=`basename "$0"`
        showStep "Running '${THIS_SCRIPT}'"
    }

# displays where we are, uses the indent function (above) to indent each line
function showStep ()
    {
        echo -e "${YELLOW}=====================================================" | indent
        echo -e "${RESET}-----> $*" | indent
        echo -e "${YELLOW}=====================================================${RESET}" | indent
    }

showStep  "installation script for the Zero To Blockchain Series \n This is for MS Windows ONLY \n The script will then install the nodejs SDK for hyperledger and composer" 


showStep "Install the node modules required to work with hyperledger composer"
showStep "The composer-cli contains all the command line operations for developing business networks." 
            npm install -g --python=python2.7 composer-cli
showStep "The generator-hyperledger-composer is a Yeoman plugin that creates bespoke applications for your business network." 
            npm install -g --python=python2.7 generator-hyperledger-composer
showStep "The composer-rest-server uses the Hyperledger Composer LoopBack Connector to connect to a business network, extract the models and then present a page containing the REST APIs that have been generated for the model. "
            npm install -g --python=python2.7 composer-rest-server
showStep "Yeoman is a tool for generating applications. When combined with the generator-hyperledger-composer component, it can interpret business networks and generate applications based on them." 
            npm install -g --python=python2.7 yo
