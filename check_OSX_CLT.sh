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
# displays where we are, uses the indent function (above) to indent each line
function showStep ()
    {
#        echo -e "${YELLOW}=====================================================" | indent
        echo -e "${RESET}-----> $*" | indent
#        echo -e "${YELLOW}=====================================================${RESET}" | indent
    }


if      pkgutil --pkg-info com.apple.pkg.CLTools_Executables >/dev/null 2>&1
then    showStep '%s\n' "CHECKING INSTALLATION"
        count=0
        pkgutil --files com.apple.pkg.CLTools_Executables |
        while IFS= read file
        do
        test -e  "/${file}"         &&
        showStep "/${file}${GREEN} … OK${RESET}" ||
        { 
            showStep "/${RED}${file} … MISSING${RESET}"; 
            ((count++)); 
        }
        done
        if      (( count > 0 ))
        then    printf '%s\n' "Command Line Tools are not installed properly"
                echo "#################"
                echo "Xcode is not installed on your system."
                echo "Please go to the Apple App Store on your computer and"
                echo "Install or Update your current version of Xcode."
                echo " "
                echo "Then restart the installation after Xcode has downloaded and installed"
                echo "#################"
        else    
            printf '%s\n' "Command Line Tools are installed"
        fi
else   printf '%s\n' "Command Line Tools are not installed"
       echo "#################"
       echo "Xcode is not installed on your system."
       echo "Please go to the Apple App Store on your computer and"
       echo "Install or Update your current version of Xcode."
       echo " "
       echo "Then restart the installation after Xcode has downloaded and installed"
       echo "#################"
   
fi