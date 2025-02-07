# #!/bin/sh
# echo ''
# echo '-------'
# echo '请在script目录执行'
# echo '-------'
# echo ''

# cd ..
# echo 'enable ptt'
# sed -i '' 's/ENABLE_PTT = false/ENABLE_PTT = true/' src/config.js
# echo 'enable conference'
# cp src/wfc/av/internal/engine-conference.min.js src/wfc/av/internal/engine.min.js

# # 打包所有
# /bin/rm -rf dist_electron
# npm run cross-package-all

# echo 'checkout modification'
# git checkout -- src/wfc/av/internal/engine.min.js
# git checkout -- src/config.js


#!/bin/sh

#if [ -z "$GH_TOKEN" ]; then
#    echo "You must set the GH_TOKEN environment variable."
#    echo "See README.md for more details."
#    exit 1
#fi

# This will build, package and upload the app to GitHub.
npm run build && node_modules/.bin/build --projectDir ./dist --win --mac --linux -p always

