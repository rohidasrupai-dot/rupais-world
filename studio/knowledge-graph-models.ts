export type KnowledgeNodeType='lesson'|'subject'|'chapter'|'topic'|'subtopic'|'concept';
export type KnowledgeRelationshipType='prerequisite'|'related_concept'|'broader_topic'|'narrower_topic'|'historical_influence'|'geographical_relationship'|'scientific_explanation'|'mathematical_dependency'|'cause'|'effect'|'comparison'|'timeline'|'similarity'|'contrast'|'depends_on'|'explains'|'influenced_by'|'leads_to'|'commonly_confused_with'|'often_studied_together'|'real_world_application';
export type KnowledgeConfidence='learned'|'familiar'|'uncertain'|'needs_revision';
export interface KnowledgeGraphNode{id:string;sourceId:string;projectId:string|null;type:KnowledgeNodeType;title:string;subject:string|null;parentNodeId:string|null;verified:boolean}
export interface KnowledgeGraphRelationship{id:string;fromNodeId:string;toNodeId:string;type:KnowledgeRelationshipType;status:'approved'|'draft'|'rejected';evidence:string;approvedBy:string|null}
