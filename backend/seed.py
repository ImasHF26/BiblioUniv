"""
Script d'initialisation de la base de données avec des données de test.
Usage: python seed.py
"""
from datetime import date, timedelta
from database import SessionLocal, engine
import models
from auth import get_password_hash

def seed():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(models.User).first():
        print("Base de données déjà initialisée.")
        db.close()
        return

    print("Initialisation de la base de données...")

    # Categories
    categories = [
        models.Category(name="Informatique", description="Livres de programmation et systèmes"),
        models.Category(name="Mathématiques", description="Algèbre, analyse, statistiques"),
        models.Category(name="Physique", description="Mécanique, thermodynamique, optique"),
        models.Category(name="Chimie", description="Chimie générale et organique"),
        models.Category(name="Biologie", description="Biologie cellulaire et moléculaire"),
        models.Category(name="Droit", description="Droit civil, pénal et administratif"),
        models.Category(name="Économie", description="Macro et microéconomie"),
        models.Category(name="Littérature", description="Littérature française et mondiale"),
        models.Category(name="Histoire", description="Histoire ancienne et moderne"),
        models.Category(name="Philosophie", description="Philosophie classique et contemporaine"),
    ]
    db.add_all(categories)
    db.flush()

    # Users
    users = [
        models.User(
            matricule="ADM001",
            email="admin@biblio.edu",
            full_name="Administrateur Système",
            hashed_password=get_password_hash("admin123"),
            role=models.UserRole.ADMIN,
            department="Administration",
            phone="0600000001",
        ),
        models.User(
            matricule="LIB001",
            email="bibliothecaire@biblio.edu",
            full_name="Fatima Zahra Benali",
            hashed_password=get_password_hash("lib123"),
            role=models.UserRole.LIBRARIAN,
            department="Bibliothèque",
            phone="0600000002",
        ),
        models.User(
            matricule="ENS001",
            email="prof.alami@biblio.edu",
            full_name="Dr. Youssef Alami",
            hashed_password=get_password_hash("ens123"),
            role=models.UserRole.TEACHER,
            department="Informatique",
            phone="0600000003",
        ),
        models.User(
            matricule="ETU2024001",
            email="sara.mansouri@etudiant.edu",
            full_name="Sara Mansouri",
            hashed_password=get_password_hash("etu123"),
            role=models.UserRole.STUDENT,
            department="Génie Informatique",
            phone="0600000004",
        ),
        models.User(
            matricule="ETU2024002",
            email="karim.tahiri@etudiant.edu",
            full_name="Karim Tahiri",
            hashed_password=get_password_hash("etu123"),
            role=models.UserRole.STUDENT,
            department="Mathématiques",
            phone="0600000005",
        ),
        models.User(
            matricule="ETU2024003",
            email="nadia.ouali@etudiant.edu",
            full_name="Nadia Ouali",
            hashed_password=get_password_hash("etu123"),
            role=models.UserRole.STUDENT,
            department="Physique",
            phone="0600000006",
        ),
    ]
    db.add_all(users)
    db.flush()

    # Books
    books = [
        models.Book(isbn="978-2100756810", title="Introduction à l'algorithmique", author="Thomas Cormen", publisher="Dunod", publication_year=2022, category_id=categories[0].id, total_copies=3, available_copies=3, description="La bible de l'algorithmique"),
        models.Book(isbn="978-2100820368", title="Python pour les Data Scientists", author="Jake VanderPlas", publisher="O'Reilly", publication_year=2023, category_id=categories[0].id, total_copies=4, available_copies=4),
        models.Book(isbn="978-2100586554", title="Réseaux et Télécommunications", author="Guy Pujolle", publisher="Eyrolles", publication_year=2021, category_id=categories[0].id, total_copies=2, available_copies=2),
        models.Book(isbn="978-2100794386", title="Analyse Mathématique 1", author="Walter Rudin", publisher="Dunod", publication_year=2020, category_id=categories[1].id, total_copies=5, available_copies=5),
        models.Book(isbn="978-2100812738", title="Algèbre Linéaire", author="Gilbert Strang", publisher="MIT Press", publication_year=2021, category_id=categories[1].id, total_copies=3, available_copies=3),
        models.Book(isbn="978-2100753468", title="Mécanique Quantique", author="Claude Cohen-Tannoudji", publisher="EDP Sciences", publication_year=2019, category_id=categories[2].id, total_copies=2, available_copies=2),
        models.Book(isbn="978-2100786824", title="Thermodynamique Appliquée", author="Olivier Cleynen", publisher="Dunod", publication_year=2022, category_id=categories[2].id, total_copies=3, available_copies=3),
        models.Book(isbn="978-2100759842", title="Chimie Générale", author="Peter Atkins", publisher="De Boeck", publication_year=2021, category_id=categories[3].id, total_copies=4, available_copies=4),
        models.Book(isbn="978-2100821654", title="Biologie Moléculaire", author="Bruce Alberts", publisher="Flammarion", publication_year=2023, category_id=categories[4].id, total_copies=3, available_copies=3),
        models.Book(isbn="978-2100567234", title="Droit Civil Marocain", author="Ahmed Senhaji", publisher="Maghrébine", publication_year=2022, category_id=categories[5].id, total_copies=5, available_copies=5),
        models.Book(isbn="978-2100634821", title="Microéconomie", author="Robert Pindyck", publisher="Pearson", publication_year=2020, category_id=categories[6].id, total_copies=4, available_copies=4),
        models.Book(isbn="978-2100745632", title="Les Misérables", author="Victor Hugo", publisher="Gallimard", publication_year=2019, category_id=categories[7].id, total_copies=2, available_copies=2),
    ]
    db.add_all(books)
    db.flush()

    # Borrowings
    today = date.today()
    borrowings = [
        models.Borrowing(user_id=users[3].id, book_id=books[0].id, borrow_date=today - timedelta(days=10), due_date=today + timedelta(days=4), status=models.BorrowingStatus.ACTIVE),
        models.Borrowing(user_id=users[3].id, book_id=books[1].id, borrow_date=today - timedelta(days=20), due_date=today - timedelta(days=6), status=models.BorrowingStatus.OVERDUE),
        models.Borrowing(user_id=users[4].id, book_id=books[3].id, borrow_date=today - timedelta(days=5), due_date=today + timedelta(days=9), status=models.BorrowingStatus.ACTIVE),
        models.Borrowing(user_id=users[5].id, book_id=books[5].id, borrow_date=today - timedelta(days=30), due_date=today - timedelta(days=16), return_date=today - timedelta(days=2), status=models.BorrowingStatus.RETURNED),
        models.Borrowing(user_id=users[2].id, book_id=books[9].id, borrow_date=today - timedelta(days=3), due_date=today + timedelta(days=11), status=models.BorrowingStatus.ACTIVE),
    ]
    db.add_all(borrowings)
    db.flush()

    # Update available copies
    books[0].available_copies -= 1
    books[1].available_copies -= 1
    books[3].available_copies -= 1
    books[9].available_copies -= 1

    # Penalties for overdue
    penalty = models.Penalty(
        borrowing_id=borrowings[1].id,
        amount=30.0,
        reason="Retard de 6 jours (5 MAD/jour)",
        is_paid=False,
    )
    db.add(penalty)

    db.commit()
    print("✅ Base de données initialisée avec succès!")
    print(f"   - {len(categories)} catégories")
    print(f"   - {len(books)} livres")
    print(f"   - {len(users)} utilisateurs")
    print(f"   - {len(borrowings)} emprunts")
    print("\nComptes de connexion:")
    print("  Admin:          admin@biblio.edu        / admin123")
    print("  Bibliothécaire: bibliothecaire@biblio.edu / lib123")
    print("  Enseignant:     prof.alami@biblio.edu   / ens123")
    print("  Étudiant:       sara.mansouri@etudiant.edu / etu123")
    db.close()


if __name__ == "__main__":
    seed()
