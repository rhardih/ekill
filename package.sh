#!/usr/bin/env bash

mkdir tmp
git archive HEAD --format=zip > tmp/ekill.zip

pushd tmp

zip -d ekill.zip .gitignore
zip -d ekill.zip README.md
zip -d ekill.zip package.sh
zip -d ekill.zip example.gif

popd

if [ ! -f ekill.zip ];
then
  rm ekill.zip
fi

mv tmp/ekill.zip .
rm -rf tmp

zipinfo ekill.zip
