import type {Snapshot} from './catalog';
// Keep administrative annotations and deleted examples out of the customer payload.
export function customerSnapshot(snapshot:Snapshot):Snapshot {
 return {...snapshot,removedNews:undefined,autoHiddenNewsCount:undefined,newsPolicy:undefined,pendingStories:undefined,marketErrors:[],storageError:undefined,
 sources:snapshot.sources.map(s=>({...s,error:null,audit:undefined})),
 stories:snapshot.stories.filter(s=>!s.hiddenFromCustomer).map(s=>({...s,impact:undefined,reviewReason:undefined,contentFingerprint:undefined,editorial:s.editorial?{...s.editorial,whyToday:'',evidence:'',limitations:'',note:undefined}:undefined}))};
}
