from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('issues', '0001_initial'),
    ]

    operations = [
        # Composite index for board queries: filter by project+status, order by position
        migrations.RunSQL(
            sql="""
                CREATE INDEX IF NOT EXISTS issues_issue_project_status_position
                ON issues_issue (project_id, status, position);
            """,
            reverse_sql="DROP INDEX IF EXISTS issues_issue_project_status_position;",
        ),
        # Index for assignee filter
        migrations.RunSQL(
            sql="""
                CREATE INDEX IF NOT EXISTS issues_issue_assignee_id
                ON issues_issue (assignee_id)
                WHERE assignee_id IS NOT NULL;
            """,
            reverse_sql="DROP INDEX IF EXISTS issues_issue_assignee_id;",
        ),
        # Full-text search: generated tsvector column + GIN index
        migrations.RunSQL(
            sql="""
                ALTER TABLE issues_issue
                ADD COLUMN IF NOT EXISTS search_vector tsvector
                GENERATED ALWAYS AS (
                    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
                ) STORED;

                CREATE INDEX IF NOT EXISTS issues_issue_search_vector_gin
                ON issues_issue USING GIN (search_vector);
            """,
            reverse_sql="""
                DROP INDEX IF EXISTS issues_issue_search_vector_gin;
                ALTER TABLE issues_issue DROP COLUMN IF EXISTS search_vector;
            """,
        ),
    ]
