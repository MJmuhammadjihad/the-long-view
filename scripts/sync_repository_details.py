#!/usr/bin/env python3
"""Preview or fill missing GitHub About fields from reviewed repository manifests.

Uses the user's existing GitHub CLI login. Never reads or prints access tokens.
No writes occur without --apply. Existing nonempty fields and topics are preserved.
"""
import argparse
import base64
import json
import re
import subprocess
import sys

class ApiError(RuntimeError):
    pass

def api(method, path, payload=None):
    command=['gh','api','--method',method,path]
    data=None
    if payload is not None:
        command += ['--input','-']
        data=json.dumps(payload)
    result=subprocess.run(command,input=data,capture_output=True,text=True)
    if result.returncode:
        # GitHub error messages are sufficient; no credential introspection is needed.
        try: message=json.loads(result.stdout).get('message','GitHub request failed')
        except (ValueError,AttributeError): message='GitHub request failed; check your own gh login and repository permissions.'
        raise ApiError(f'{method} {path}: {message}')
    return json.loads(result.stdout) if result.stdout.strip() else {}

def validate_manifest(data, repository):
    if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+',repository):
        raise ValueError('Invalid owner/repository name')
    if not isinstance(data,dict) or data.get('repository')!=repository:
        raise ValueError('Manifest repository does not match the explicitly requested target')
    if not isinstance(data.get('description'),str) or not 1<=len(data['description'])<=350:
        raise ValueError('Description must contain 1–350 characters')
    if not isinstance(data.get('homepage'),str) or not data['homepage'].startswith('https://'):
        raise ValueError('Homepage must be an HTTPS URL')
    topics=data.get('topics')
    if not isinstance(topics,list) or not 1<=len(topics)<=20 or any(not isinstance(t,str) or not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,49}',t) for t in topics):
        raise ValueError('Use 1–20 lowercase GitHub topics')
    if len(set(topics))!=len(topics):
        raise ValueError('Manifest has duplicate topics')
    return data

def plan_details(current, wanted):
    patch={key:wanted[key] for key in ['description','homepage'] if not (current.get(key) or '').strip()}
    existing=current.get('topics') or []
    merged=list(dict.fromkeys([*existing,*wanted['topics']]))
    if len(merged)>20:
        raise ValueError('Combined topics exceed GitHub’s limit; review existing topics manually')
    return patch,merged

def sync_repository(repository, apply=False, request=api, emit=print):
    encoded=request('GET',f'repos/{repository}/contents/repository-details.json')
    try:
        wanted=validate_manifest(json.loads(base64.b64decode(encoded['content']).decode('utf-8')),repository)
    except (KeyError,ValueError,UnicodeError,TypeError) as error:
        raise ValueError(f'Invalid repository-details.json in {repository}: {error}') from error
    current=request('GET',f'repos/{repository}')
    patch,topics=plan_details(current,wanted)
    topic_change=set(topics)!=set(current.get('topics') or [])
    emit(repository)
    for key in ['description','homepage']:
        emit(f'  {key}: '+(f"fill with {patch[key]}" if key in patch else 'preserve existing value'))
    emit('  topics: '+', '.join(topics))
    if not apply:
        emit('  Preview only. Run with --apply to write these missing details.')
        return False
    if patch:
        request('PATCH',f'repos/{repository}',patch)
    if topic_change:
        request('PUT',f'repos/{repository}/topics',{'names':topics})
    actual=request('GET',f'repos/{repository}')
    for key,value in patch.items():
        if actual.get(key)!=value:
            raise ApiError(f'{repository}: {key} did not match after the update')
    if not set(topics).issubset(set(actual.get('topics') or [])):
        raise ApiError(f'{repository}: topics did not match after the update')
    emit('  Verified on GitHub.' if patch or topic_change else '  Already complete; no changes needed.')
    return bool(patch or topic_change)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo',action='append',required=True,help='Explicit owner/name target; repeat for several repositories')
    parser.add_argument('--apply',action='store_true',help='Fill only missing About fields and add topics; then verify')
    args=parser.parse_args()
    try:
        login=api('GET','user')['login']
    except (ApiError,KeyError,FileNotFoundError):
        print('Use an owner-authorized GitHub CLI session. Install gh if needed, then run gh auth login. Never paste a token into an issue or chat.',file=sys.stderr)
        return 1
    failed=False
    for repository in dict.fromkeys(args.repo):
        if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+',repository):
            print(f'Invalid repository: {repository}',file=sys.stderr);failed=True;continue
        if repository.split('/')[0].lower()!=login.lower():
            print(f'Skipping {repository}: this helper only updates repositories owned by the authenticated user.',file=sys.stderr);failed=True;continue
        try:
            sync_repository(repository,args.apply)
        except (ApiError,ValueError) as error:
            print(str(error),file=sys.stderr)
            print('The connection may lack repository Administration access. Use your own owner-authorized gh session or edit the About panel and click Save. Re-running safely continues a partial update.',file=sys.stderr)
            failed=True
    return 1 if failed else 0

if __name__=='__main__':
    sys.exit(main())
