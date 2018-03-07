#!/bin/bash

CARD=""
ADDRESS=""

Usage() {
	echo ""
	echo "Usage: ./update_card.sh -c card -a ip_address|hostname"
    echo "this will backup the original file to same name but with a .orig extension"
	echo ""
	echo "Options:"
	echo -e "\t-a or --address:\tUpdate the card to point to a single ip address or hostname"
	echo -e "\t-c or --card:\t\tThe card file to update"
	echo ""
	echo "Example: ./update_card.sh -c admin.card -a 183.154.34.67"
	echo ""
	exit 1
}

Parse_Arguments() {
	while [ $# -gt 0 ]; do
		case $1 in
			--address | -a)
				shift
				ADDRESS="$1"
				;;
			--card | -c)
				shift
				INCARD=$1
				;;
		esac
		shift
	done
}
Parse_Arguments $@

if [ "$INCARD" == "" ] || [ "$ADDRESS" == "" ];then
	Usage
fi

# select a temporary directory for storage
TMPDIR=/tmp/_expandedCard
rm -fr $TMPDIR
mkdir $TMPDIR

# get fpq to card
RELDIR=$(dirname -- "$INCARD")
BASEFILE=$(basename -- "$INCARD")
CARD=$(cd "$RELDIR" 2>/dev/null && printf '%s/%s\n' "$(pwd -P)" "$BASEFILE")
if [ ! -f "$CARD" ];then
	echo "$CARD does not exist"
	exit 1
fi

# unzip the card into storage
unzip "$CARD" -d $TMPDIR

# patch connection.json
cat $TMPDIR/connection.json | \
sed 's/blockchain-orderer/'${ADDRESS}'/g;' | \
sed 's/blockchain-ca/'${ADDRESS}'/g;' | \
sed 's/blockchain-org1peer1/'${ADDRESS}'/g;' \
> $TMPDIR/connection2.json
rm $TMPDIR/connection.json
mv $TMPDIR/connection2.json $TMPDIR/connection.json

# backup the original file
mv "$CARD" "$CARD.orig"

# zip up the file
cd $TMPDIR
zip -r "$CARD" *

# clean up
cd -
rm -fr $TMPDIR      