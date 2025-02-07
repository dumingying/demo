#! /bin/sh
desktopPath=/opt/链上会/entries/applications/com.tongfudun.chainpal.desktop
rootDesktop=/root/Desktop
if [ -d $rootDesktop ]; then
  cp $desktopPath $rootDesktop
fi

users=$(users)
for u in $users; do
  dir=/home/$u/Desktop
  cndir=/home/$u/桌面
  if [ -d $dir ]; then
    cp $desktopPath $dir
    chmod 777 $dir/com.tongfudun.chainpal.desktop
  fi
  if [ -d $cndir ]; then
    cp $desktopPath $cndir
    chmod 777 $cndir/com.tongfudun.chainpal.desktop
  fi
done
