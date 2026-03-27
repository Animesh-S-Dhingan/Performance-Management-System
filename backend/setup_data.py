import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gms.settings')
django.setup()

from core.models import User, EvaluationDimension, AdminConfig

def setup():
    # Create Dimensions
    dimensions = ['Quality', 'Ownership', 'Communication', 'Timeliness', 'Initiative']
    for d in dimensions:
        EvaluationDimension.objects.get_or_create(name=d)
    
    # Create Admin
    admin, created = User.objects.get_or_create(
        username='admin@pms.com',
        email='admin@pms.com',
        first_name='System',
        last_name='Admin',
        role=User.Role.ADMIN
    )
    if created:
        admin.set_password('admin123')
        admin.save()
        print("Created Admin: admin@pms.com / admin123")

    # Create Manager
    manager, created = User.objects.get_or_create(
        username='manager@pms.com',
        email='manager@pms.com',
        first_name='Alice',
        last_name='Manager',
        role=User.Role.MANAGER
    )
    if created:
        manager.set_password('manager123')
        manager.save()
        print("Created Manager: manager@pms.com / manager123")

    # Create Employee
    employee, created = User.objects.get_or_create(
        username='employee@pms.com',
        email='employee@pms.com',
        first_name='Bob',
        last_name='Employee',
        role=User.Role.EMPLOYEE,
        evaluator=manager
    )
    if created:
        employee.set_password('employee123')
        employee.save()
        print("Created Employee: employee@pms.com / employee123 (Reporting to Alice)")

    # Initial Admin Config
    AdminConfig.objects.get_or_create(
        key='flag_thresholds',
        defaults={'value': {'low_score': 2.5, 'aging_days': 7}}
    )
    
    print("Setup complete!")

if __name__ == "__main__":
    setup()
