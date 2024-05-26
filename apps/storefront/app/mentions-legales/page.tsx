import { routes } from '@couture-next/routing';
import { generateMetadata } from '@couture-next/utils';

export const metadata = generateMetadata({
  title: 'Mentions légales',
  alternates: { canonical: routes().legal().noticies() },
  description: 'Mentions légales du site Petit Roudoudou',
});

export default function LegalNoticies() {
  return (
    <>
      <h1>Informations légales</h1>
      <p>
        Merci de lire attentivement les présentes modalités d'utilisation du présent site avant de le parcourir. En vous
        connectant sur ce site, vous acceptez sans réserve les présentes modalités.
      </p>
      <h2>Editeur du site</h2>
      <p>
        Le site www.petit-roudoudou.fr est conçu et maintenu par l&apos;auto-entrepreneur Monsieur Thomas Bouillon
        immatriculé par le Siret suivant : 90105505300010 Il est joignable par email: contact@petit-roudoudou.fr
      </p>
      <h2>Conditions d'utilisation</h2>
      <p>
        Le site accessible par l'url suivants : www.petit-roudoudou.fr est exploité dans le respect de la législation
        française. L'utilisation de ce site est régie par les présentes conditions générales. En utilisant le site, vous
        reconnaissez avoir pris connaissance de ces conditions et les avoir acceptées. Celles-ci pourront être modifiées
        à tout moment et sans préavis par Petit Roudoudou. Petit roudoudou net ne saurait être tenu pour responsable en
        aucune manière d&apos;une mauvaise utilisation du service.
      </p>
      <h2>Limitation de responsabilité</h2>
      <p>
        Les informations contenues sur ce site sont aussi précises que possibles et le site est périodiquement remis à
        jour, mais peut toutefois contenir des inexactitudes, des omissions ou des lacunes. Si vous constatez une
        lacune, erreur ou ce qui parait être un dysfonctionnement, merci de bien vouloir le signaler par email en
        décrivant le problème de la manière la plus précise possible (page posant problème, action déclenchante, type
        d&apos;ordinateur et de navigateur utilisé, …).
      </p>
      <p>Les photos sont non contractuelles.</p>
      <h3>Aperçu des créations</h3>
      <p>
        Les aperçus des créations que vous avez créées et personnalisées vous même n'ont aucune valeur quant à la
        représentation de la création réelle. Ces aperçus ont pour seul but de se faire une idée par rapport aux
        assemblages de tissus. En particulier, l'échelle utilisée pour la taille des images de tissus par rapport à la
        taille de l'article. Il se peut que les motifs présents sur les tissus appaissent plus gros ou plus petits que
        dans la réalité.
      </p>
      <h2>Droit d'accès</h2>
      <p>
        Conformément à la loi 78-17 du 6 janvier 1978 (modifiée par la loi 2004-801 du 6 août 2004 relative à la
        protection des personnes physiques à l'égard des traitements de données à caractère personnel) les internautes
        disposent d&apos;un droit d&apos;accès, de rectification, de modification et de suppression concernant les
        données qui les concernent personnellement. Ce droit peut être exercé par voie électronique à l&apos;adresse
        email suivante : contact@petit-roudoudou.fr
      </p>
      <h2>Utilisation des données personnelles</h2>
      <p>
        Les informations personnelles collectées ne sont en aucun cas confiées à des tiers et utilisées seulement pour
        le bon fonctionnement du site.
      </p>
      <h2>Confidentialité</h2>
      <p>
        Dans le but de respecter la vie privée des utilisateurs du site, www.petit-roudoudou.fr s&apos;engage à traiter
        les données personnelles dans la plus stricte confidentialité et en totale conformité aux nouvelles
        réglementations européenne et française en vigueur.
      </p>
      <p>
        La présente est destinée à informer les utilisateurs en toute transparence des méthodes de collecte de données
        personnelles que www.petit-roudoudou.fr utilise, de l&apos;utilisation des données ainsi collectées, des
        procédures de sécurité mises en place et des droits dont disposent les utilisateurs.
      </p>
      <p>
        L&apos;utilisateur reconnaît avoir pris connaissance de la présente politique et reconnaît en accepter les
        termes.
      </p>
      <h2>Responsable de traitement</h2>
      <p>
        Petit Roudoudou est la responsable de traitement et assume donc à ce titre, la responsabilité de la collecte et
        de la gestion des données personnelles de ses utilisateurs conformément aux dispositions du règlement (UE)
        n°2016/679 du 27 avril 2016 relatif à la protection des données à caractère personnel.
      </p>
      <h2>Finalités de la collecte</h2>
      <p>
        Petit Roudoudou utilise les données de l&apos;utilisateur afin de lui permettre de communiquer sur sa commande,
        les offre et répondre à toutes demandes.
      </p>
      <p>
        En remplissant et en envoyant le formulaire, l&apos;utilisateur consent à ce que Petit Roudoudou collecte et
        traite ses données personnelles.
      </p>
      <h2>Méthodes de collecte</h2>
      <p>
        Les données sont collectées par l&apos;intervention active de l&apos;utilisateur, qui transmet ses données
        d&apos;identification.
      </p>
      <p>Sécurité des données personnelles</p>
      <p>
        Petit Roudoudou s&apos;engage à tout mettre en œuvre pour assurer la confidentialité et la sécurité des données
        de l&apos;utilisateur ou à faire assurer ces obligations aux sous-traitants choisis.
      </p>
      <h2>Traitement des données nominatives</h2>
      <p>
        Les données nominatives communiquées par l&apos;utilisateur ou collectées via le fonctionnement du site ont pour
        objectif d&apos;assurer le service voire la prestation demandée par le Client.
      </p>
      <p>Elles ne seront pas utilisées pour d'autres usages que ceux indiqués ci-dessous :</p>
      <ul>
        <li>Répondre à la demande initiale du Client;</li>
        <li>Réalisation de la Prestation demandée</li>
        <li>Adressage d'offres commerciales.</li>
      </ul>
      <p>
        En application de la Loi n° 78-17 du 6 janvier 1978 relative à l'Informatique, aux Fichiers et aux Libertés et
        conformément au règlement (UE) 2016/679 du Parlement européen et du Conseil du 27 avril 2016 applicable à
        compter du 25 mai 2018, vous disposez des droits d'opposition, d'accès et de rectification des données vous
        concernant.
      </p>
      <p>Ainsi, vous pouvez nous contacter pour que soient rectifiées, complétées, mises à jour ou effacées.</p>
      <p>
        Les utilisateurs de ce site disposent d'un droit d'accès, de rectification et d'opposition qu'ils peuvent
        exercer de la manière suivante :
      </p>
      <p>- par email : contact@petit-roudoudou.fr</p>
      <h2>Hébergeur</h2>
      <p>Le site internet de Petit Roudoudou est hébergé par la plateforme : Google Cloud Platform</p>
      <h2>Cookies</h2>
      <p>Nous utilisons des cookies uniquement pour améliorer l'expérience de l'utilisateur</p>
      <style>{inlineCss}</style>
    </>
  );
}

const inlineCss = `h2 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1.2;
  color: inherit;
}

h1 {
  font-size: 2.5rem;
}

main {
  padding: 0 1rem;
}

p,
ul,
li {
  margin: 0 1rem;
}

ul {
  margin-bottom: 1rem;
}`;
