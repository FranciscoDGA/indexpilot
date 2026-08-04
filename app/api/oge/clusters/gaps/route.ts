import { NextRequest, NextResponse } from 'next/server';
import { TopicClusterEngine } from '@/lib/services/oge/topicClusterEngine';
import { verifyAuth } from '@/lib/supabase/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publicationId = request.nextUrl.searchParams.get('publication_id');
    if (!publicationId) {
      return NextResponse.json(
        { error: 'publication_id is required' },
        { status: 400 }
      );
    }

    const engine = new TopicClusterEngine();
    const gaps = await engine.detectClusterGaps(publicationId);
    const stats = await engine.getClusterStats(publicationId);

    return NextResponse.json({
      data: gaps,
      count: gaps.length,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error detecting cluster gaps:', error);
    return NextResponse.json(
      { error: 'Failed to detect cluster gaps' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { publication_id, pillar_topic, cluster_type, target_articles } = body;

    if (!publication_id || !pillar_topic) {
      return NextResponse.json(
        { error: 'publication_id and pillar_topic are required' },
        { status: 400 }
      );
    }

    const engine = new TopicClusterEngine();
    const clusterId = await engine.createCluster(
      publication_id,
      pillar_topic,
      cluster_type,
      target_articles || 10
    );

    return NextResponse.json({
      success: true,
      cluster_id: clusterId,
      message: 'Cluster created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating cluster:', error);
    return NextResponse.json(
      { error: 'Failed to create cluster' },
      { status: 500 }
    );
  }
}
