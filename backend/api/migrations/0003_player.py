# Generated by Django 5.2.4 on 2025-07-26 14:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_loan'),
    ]

    operations = [
        migrations.CreateModel(
            name='Player',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=150, unique=True)),
                ('position', models.CharField(choices=[('Forward', 'Forward'), ('Defender', 'Defender'), ('Midfielder', 'Midfield'), ('Coach', 'Coach'), ('Ass_Coach', 'Assistant Coach'), ('Manager', 'Manager'), ('Team_doctor', 'Team Doctor')], max_length=20)),
            ],
        ),
    ]
