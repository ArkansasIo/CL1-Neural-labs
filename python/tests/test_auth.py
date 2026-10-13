from cl1_neural_lab.auth import *
def test_password_hash():
 h=hash_password("correct horse battery staple");assert verify_password("correct horse battery staple",h);assert not verify_password("wrong",h)
def test_login_logout():
 s=MemoryAuthStore();s.register("alice","alice@example.test","correct horse battery staple");_,t=s.login("alice","correct horse battery staple");assert s.authenticate(t).username=="alice";s.logout(t)
def test_permissions():
 s=MemoryAuthStore();u=s.register("r","r@example.test","correct horse battery staple");u.roles={"researcher"};assert PermissionService().allowed(u,"experiments.run");assert not PermissionService().allowed(u,"users.manage")