#! /bin/sh

DIRNAME=$(cd $(dirname $0);pwd)
find $DIRNAME/js $DIRNAME/src -type f | xargs wc -l
echo GIT logs: `git --git-dir=${DIRNAME}/.git log --pretty=oneline | wc -l`
