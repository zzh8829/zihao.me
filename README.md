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
