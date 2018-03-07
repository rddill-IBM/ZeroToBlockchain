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

OS=$(uname)
export OS=$OS

# displays where we are, uses the indent function (above) to indent each line
function showStep ()
    {
        echo -e "${YELLOW}=====================================================" | indent
        echo -e "${RESET}-----> $*" | indent
        echo -e "${YELLOW}=====================================================${RESET}" | indent
    }

# Grab the current directory
function getCurrent() 
    {
        showStep "getting current directory"
        DIR="$( pwd )"
        echo "DIR in getCurrent is: ${DIR}"
        THIS_SCRIPT=`basename "$0"`
        showStep "Running '${THIS_SCRIPT}'"
    }