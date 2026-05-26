import uuid

import factory
from django.contrib.auth import get_user_model

from organizations.models import Membership, Organization
from projects.models import Project
from issues.models import Activity, Comment, Issue, Label

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.LazyAttribute(lambda _: f'user-{uuid.uuid4().hex[:8]}@example.com')
    full_name = factory.Sequence(lambda n: f'User {n}')
    is_active = True
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')


class WorkspaceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Organization

    name = factory.Sequence(lambda n: f'Workspace {n}')
    slug = factory.LazyAttribute(lambda _: f'ws-{uuid.uuid4().hex[:8]}')


class MembershipFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Membership
        django_get_or_create = ('organization', 'user')

    organization = factory.SubFactory(WorkspaceFactory)
    user = factory.SubFactory(UserFactory)
    role = Membership.MEMBER


class ProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Project

    organization = factory.SubFactory(WorkspaceFactory)
    name = factory.Sequence(lambda n: f'Project {n}')
    key = factory.LazyAttribute(lambda _: uuid.uuid4().hex[:4].upper())


class LabelFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Label
        django_get_or_create = ('organization', 'name')

    organization = factory.SubFactory(WorkspaceFactory)
    name = factory.Sequence(lambda n: f'Label {n}')
    color = '#6366f1'


class IssueFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Issue

    project = factory.SubFactory(ProjectFactory)
    identifier = factory.LazyAttribute(lambda o: f'{o.project.key}-{uuid.uuid4().hex[:6].upper()}')
    title = factory.Sequence(lambda n: f'Issue {n}')
    status = Issue.Status.BACKLOG
    priority = Issue.Priority.NONE
    position = factory.LazyAttribute(lambda _: f'a{uuid.uuid4().hex[:4]}')
    creator = factory.SubFactory(UserFactory)

    @factory.post_generation
    def sync_issue_count(obj, create, extracted, **kwargs):
        if create:
            from django.db.models import F
            Project.objects.filter(pk=obj.project_id).update(issue_count=F('issue_count') + 1)


class CommentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Comment

    issue = factory.SubFactory(IssueFactory)
    author = factory.SubFactory(UserFactory)
    body = factory.Sequence(lambda n: f'Comment body {n}')


class ActivityFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Activity

    issue = factory.SubFactory(IssueFactory)
    actor = factory.SubFactory(UserFactory)
    verb = Activity.CREATED
    data = factory.LazyAttribute(lambda o: {'title': o.issue.title})
