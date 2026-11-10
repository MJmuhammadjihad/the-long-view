"""Verify dry-run behavior, preservation and remote-update verification without a network."""
import base64,copy,importlib.util,json,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('details',Path(__file__).resolve().parents[1]/'scripts/sync_repository_details.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
REPO='owner/tool'
WANTED={'repository':REPO,'description':'A useful toolkit','homepage':'https://owner.github.io/tool/','topics':['education','planning']}
class FakeAPI:
    def __init__(self,current=None,ignore_writes=False):self.current=current or {'description':None,'homepage':None,'topics':[]};self.calls=[];self.ignore=ignore_writes
    def __call__(self,method,path,payload=None):
        self.calls.append((method,path,payload))
        if path.endswith('contents/repository-details.json'):return {'content':base64.b64encode(json.dumps(WANTED).encode()).decode()}
        if method=='GET':return copy.deepcopy(self.current)
        if self.ignore:return {}
        if method=='PATCH':self.current.update(payload)
        elif method=='PUT':self.current['topics']=payload['names']
        return {}
class Tests(unittest.TestCase):
    def test_preview_does_not_write(self):
        api=FakeAPI();m.sync_repository(REPO,request=api,emit=lambda _:None)
        self.assertTrue(all(c[0]=='GET' for c in api.calls));self.assertIsNone(api.current['description'])
    def test_apply_is_verified_and_idempotent(self):
        api=FakeAPI();self.assertTrue(m.sync_repository(REPO,True,api,lambda _:None));writes=len([c for c in api.calls if c[0]!='GET'])
        self.assertFalse(m.sync_repository(REPO,True,api,lambda _:None));self.assertEqual(writes,len([c for c in api.calls if c[0]!='GET']))
    def test_existing_details_preserved(self):
        api=FakeAPI({'description':'Owner’s description','homepage':'https://example.com','topics':['custom']})
        m.sync_repository(REPO,True,api,lambda _:None)
        self.assertEqual(api.current['description'],'Owner’s description');self.assertEqual(api.current['homepage'],'https://example.com');self.assertEqual(api.current['topics'],['custom','education','planning'])
    def test_silent_remote_failure_detected(self):
        with self.assertRaises(m.ApiError):m.sync_repository(REPO,True,FakeAPI(ignore_writes=True),lambda _:None)
    def test_topic_limit_and_target_validation(self):
        with self.assertRaises(ValueError):m.plan_details({'topics':['topic-'+str(i) for i in range(20)]},WANTED)
        with self.assertRaises(ValueError):m.validate_manifest(WANTED,'someone/else')
if __name__=='__main__':unittest.main()
