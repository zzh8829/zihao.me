# DEPRECATED !
### This repo is no longer maintained here
### New repo is at https://github.com/zzh8829/zihao

# zihao.me
My Home Page

Demo
----
http://zihao.me

Architecture
------------
* Nginx load balancing, distributes data to multiple nodejs upstreams
* Nginx serves all static public files to increase performance
* Server running nodejs to server all dynamic contents
* All data is stored in NoSQL mangodb backend
