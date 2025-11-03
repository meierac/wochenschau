/**
 * Schlachter 2000 Bible verses dataset.
 *
 * IMPORTANT (Copyright & Licensing):
 * Schlachter 2000 Bibeltext © 2000 CSV (Christliche Schriftenverbreitung).
 * Alle Rechte vorbehalten. Verwendung in einer öffentlichen Anwendung setzt die
 * Einhaltung der Lizenz-/Nutzungsbedingungen voraus. Vergewissere dich, dass du
 * die erforderliche Genehmigung besitzt, falls du den vollständigen Wortlaut
 * umfangreich verbreitest.
 *
 * Anmerkung:
 * Die hier aufgeführten Verse basieren auf dem bekannten Wortlaut der Schlachter 2000.
 * Kleinste Unterschiede in Interpunktion oder Orthographie können je nach Ausgabe (Druck / digital)
 * auftreten. Für 100% Texttreue bitte jeweils gegen deine lizenzierte Quelle prüfen.
 *
 * Struktur:
 * - Jeder Vers besitzt: id, text, reference, theme, translation.
 * - theme wurde neu zugeordnet (Faith / Hope / Love) nach inhaltlicher Gewichtung.
 *
 * Wenn du eine absolut verifizierte Version brauchst, kannst du einen automatischen
 * Abgleich gegen eine autorisierte API / Datenquelle implementieren und dieses Array
 * nur als Fallback verwenden.
 */
export type VerseTheme = "faith" | "hope" | "love";

export interface BibleVerse {
  id: string;
  text: string;
  reference: string; // Vollständiger deutscher Buchname + Kapitel,Vers(e)
  theme: VerseTheme;
  translation: "Schlachter 2000";
}

export const COPYRIGHT_NOTICE =
  "Schlachter 2000 Bibeltext © 2000 CSV (Christliche Schriftenverbreitung) – Alle Rechte vorbehalten.";

export const BIBLE_VERSES: BibleVerse[] = [
  // === Faith (Glaube / Vertrauen auf Gott) ===
  {
    id: "faith-heb-11-1",
    text: "Es ist aber der Glaube eine feste Zuversicht dessen, was man hofft, eine Überzeugung von Tatsachen, die man nicht sieht.",
    reference: "Hebräer 11,1",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-heb-11-6",
    text: "Ohne Glauben aber ist es unmöglich, ihm wohlzugefallen; denn wer zu Gott kommt, muss glauben, dass er ist und dass er denen, die ihn suchen, ein Belohner ist.",
    reference: "Hebräer 11,6",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-2kor-5-7",
    text: "Denn wir wandeln durch Glauben, nicht durch Schauen.",
    reference: "2. Korinther 5,7",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-rom-1-17",
    text: "Denn es wird darin geoffenbart die Gerechtigkeit Gottes aus Glauben zum Glauben, wie geschrieben steht: Der Gerechte wird aus Glauben leben.",
    reference: "Römer 1,17",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-rom-10-17",
    text: "So kommt der Glaube aus der Verkündigung, die Verkündigung aber durch Gottes Wort.",
    reference: "Römer 10,17",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-eph-2-8",
    text: "Denn aus Gnade seid ihr errettet durch den Glauben, und das nicht aus euch — Gottes Gabe ist es;",
    reference: "Epheser 2,8",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-joh-20-29",
    text: "Jesus spricht zu ihm: Weil du mich gesehen hast, Thomas, glaubst du; glückselig sind, die nicht sehen und doch glauben!",
    reference: "Johannes 20,29",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-joh-11-25",
    text: "Jesus sprach zu ihr: Ich bin die Auferstehung und das Leben; wer an mich glaubt, wird leben, auch wenn er stirbt;",
    reference: "Johannes 11,25",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-gal-2-20",
    text: "Ich bin mit Christus gekreuzigt, und nun lebe ich, aber nicht mehr ich selbst, sondern Christus lebt in mir; und was ich jetzt im Fleisch lebe, das lebe ich im Glauben an den Sohn Gottes, der mich geliebt und sich selbst für mich hingegeben hat.",
    reference: "Galater 2,20",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-jes-41-10",
    text: "Fürchte dich nicht, denn ich bin mit dir; hab keine Angst, denn ich bin dein Gott! Ich stärke dich, ja, ich helfe dir, ja, ich halte dich mit der rechten Hand meiner Gerechtigkeit.",
    reference: "Jesaja 41,10",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-ps-27-1",
    text: "Der HERR ist mein Licht und mein Heil; vor wem sollte ich mich fürchten? Der HERR ist meines Lebens Kraft; vor wem sollte ich mich grauen?",
    reference: "Psalm 27,1",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-phil-4-13",
    text: "Ich vermag alles durch den, der mich stärkt, Christus.",
    reference: "Philipper 4,13",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-spr-3-5-6",
    text: "Vertraue auf den HERRN von ganzem Herzen und stütze dich nicht auf deinen Verstand; erkenne ihn auf allen deinen Wegen, so wird er deine Pfade ebnen.",
    reference: "Sprüche 3,5-6",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-rom-8-31",
    text: "Was wollen wir nun hierzu sagen? Wenn Gott für uns ist, wer kann gegen uns sein?",
    reference: "Römer 8,31",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-2tim-1-7",
    text: "Denn Gott hat uns nicht einen Geist der Furcht gegeben, sondern der Kraft und der Liebe und der Besonnenheit.",
    reference: "2. Timotheus 1,7",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-1petr-1-21",
    text: "Die ihr durch ihn an Gott glaubt, der ihn aus den Toten auferweckt und ihm Herrlichkeit gegeben hat, damit euer Glaube und eure Hoffnung auf Gott gerichtet seien.",
    reference: "1. Petrus 1,21",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-apg-16-31",
    text: "Sie aber sprachen: Glaube an den Herrn Jesus Christus, so wirst du gerettet werden, du und dein Haus!",
    reference: "Apostelgeschichte 16,31",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-ps-37-3",
    text: "Vertraue auf den HERRN und tue Gutes; wohne im Land und übe Treue!",
    reference: "Psalm 37,3",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-ps-37-5",
    text: "Befiehl dem HERRN deinen Weg und vertraue auf ihn, so wird er es vollbringen;",
    reference: "Psalm 37,5",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-ps-56-4",
    text: "An dem Tag, da ich mich fürchte, vertraue ich auf dich.",
    reference: "Psalm 56,4",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-ps-62-6",
    text: "Nur auf Gott wartet still meine Seele; denn von ihm kommt meine Hoffnung.",
    reference: "Psalm 62,6",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-rom-15-13",
    text: "Der Gott der Hoffnung aber erfülle euch mit aller Freude und allem Frieden im Glauben, damit ihr überreich seid in der Hoffnung durch die Kraft des Heiligen Geistes!",
    reference: "Römer 15,13",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-mark-9-23",
    text: "Jesus aber sprach zu ihm: Wenn du glauben kannst — alle Dinge sind möglich dem, der glaubt!",
    reference: "Markus 9,23",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-eph-3-12",
    text: "In ihm haben wir Freimütigkeit und Zugang in Zuversicht durch den Glauben an ihn.",
    reference: "Epheser 3,12",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-rom-5-1",
    text: "Da wir nun aus Glauben gerechtfertigt sind, so haben wir Frieden mit Gott durch unseren Herrn Jesus Christus;",
    reference: "Römer 5,1",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-1joh-5-4",
    text: "Denn alles, was aus Gott geboren ist, überwindet die Welt; und dies ist der Sieg, der die Welt überwunden hat: unser Glaube.",
    reference: "1. Johannes 5,4",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-hab-2-4",
    text: "Siehe, aufgeblasen, nicht aufrichtig ist seine Seele in ihm; der Gerechte aber wird durch seinen Glauben leben.",
    reference: "Habakuk 2,4",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-1kor-16-13",
    text: "Wacht, steht im Glauben, seid mutig, seid stark!",
    reference: "1. Korinther 16,13",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-jak-1-6",
    text: "Er bitte aber im Glauben und zweifle nicht; denn wer zweifelt, gleicht einer Meereswoge, die vom Wind getrieben und hin und her geworfen wird.",
    reference: "Jakobus 1,6",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-1tim-6-12",
    text: "Kämpfe den guten Kampf des Glaubens; ergreife das ewige Leben, wozu du berufen worden bist und worüber du das gute Bekenntnis vor vielen Zeugen abgelegt hast.",
    reference: "1. Timotheus 6,12",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-jud-20",
    text: "Ihr aber, Geliebte, erbaut euch auf euren allerheiligsten Glauben, betet im Heiligen Geist,",
    reference: "Judas 20",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-ps-18-3",
    text: "Der HERR ist mein Fels und meine Burg und mein Erretter; mein Gott ist mein Schutz, auf ihn will ich trauen.",
    reference: "Psalm 18,3",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-ps-91-2",
    text: "Ich sage zum HERRN: Meine Zuflucht und meine Burg, mein Gott, auf den ich traue!",
    reference: "Psalm 91,2",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "faith-jer-17-7",
    text: "Gesegnet ist der Mann, der auf den HERRN vertraut und dessen Zuversicht der HERR ist.",
    reference: "Jeremia 17,7",
    theme: "faith",
    translation: "Schlachter 2000",
  },

  // === Hope (Hoffnung / Erwartung) ===
  {
    id: "hope-1petr-1-3",
    text: "Gelobt sei der Gott und Vater unseres Herrn Jesus Christus, der uns wiedergeboren hat zu einer lebendigen Hoffnung durch die Auferstehung Jesu Christi von den Toten,",
    reference: "1. Petrus 1,3",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-rom-5-5",
    text: "Die Hoffnung aber lässt nicht zuschanden werden; denn die Liebe Gottes ist ausgegossen in unsere Herzen durch den Heiligen Geist, der uns gegeben worden ist.",
    reference: "Römer 5,5",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-titus-2-13",
    text: "Indem wir die glückselige Hoffnung erwarten und die Erscheinung der Herrlichkeit des großen Gottes und unseres Retters Jesus Christus,",
    reference: "Titus 2,13",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-phil-1-6",
    text: "Ich bin davon überzeugt, dass der, welcher in euch ein gutes Werk angefangen hat, es auch vollenden wird bis auf den Tag Jesu Christi.",
    reference: "Philipper 1,6",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-rom-8-28",
    text: "Wir wissen aber, dass denen, die Gott lieben, alle Dinge zum Besten dienen, denen, die nach dem Vorsatz berufen sind.",
    reference: "Römer 8,28",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-ps-121-7",
    text: "Der HERR wird dich behüten vor allem Übel, er wird deine Seele behüten;",
    reference: "Psalm 121,7",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-ps-34-19",
    text: "Der HERR ist nahe denen, die zerbrochenen Herzens sind, und er rettet die, welche zerschlagenen Geistes sind.",
    reference: "Psalm 34,19",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-ps-27-14",
    text: "Harre auf den HERRN! Sei stark, und dein Herz fasse Mut, und harre auf den HERRN!",
    reference: "Psalm 27,14",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-ps-23-1",
    text: "Der HERR ist mein Hirte, mir wird nichts mangeln.",
    reference: "Psalm 23,1",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-2kor-9-8",
    text: "Gott aber ist mächtig, euch jede Gnade reichlich zu geben, damit ihr in allem allezeit alle Genüge habt und überreich seid zu jedem guten Werk,",
    reference: "2. Korinther 9,8",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-heb-6-19",
    text: "Diese Hoffnung haben wir als einen sicheren und festen Anker der Seele, der auch hineinreicht in das Innere hinter den Vorhang,",
    reference: "Hebräer 6,19",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-gen-28-15",
    text: "Und siehe, ich bin mit dir und will dich behüten überall, wo du hinziehst, und dich wieder in dieses Land bringen; denn ich werde dich nicht verlassen, bis ich getan habe, was ich dir zugesagt habe.",
    reference: "1. Mose 28,15",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-joh-1-12",
    text: "Allen aber, die ihn aufnahmen, denen gab er das Anrecht, Kinder Gottes zu werden, denen, die an seinen Namen glauben;",
    reference: "Johannes 1,12",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-luk-1-37",
    text: "Denn bei Gott ist kein Ding unmöglich.",
    reference: "Lukas 1,37",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-ex-14-14",
    text: "Der HERR wird für euch kämpfen, und ihr sollt still sein!",
    reference: "2. Mose 14,14",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-1joh-5-20",
    text: "Wir wissen aber, dass der Sohn Gottes gekommen ist und uns Verständnis gegeben hat, damit wir den Wahrhaftigen erkennen; und wir sind in dem Wahrhaftigen, in seinem Sohn Jesus Christus. Dieser ist der wahrhaftige Gott und das ewige Leben.",
    reference: "1. Johannes 5,20",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-ps-42-6",
    text: "Was betrübst du dich, meine Seele, und stöhnst in mir? Harre auf Gott! Denn ich werde ihn noch preisen für die Rettungen seines Angesichts.",
    reference: "Psalm 42,6",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-jak-5-15",
    text: "Und das Gebet des Glaubens wird den Kranken retten, und der Herr wird ihn aufrichten;",
    reference: "Jakobus 5,15",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-rom-12-12",
    text: "Freut euch in der Hoffnung! Seid geduldig in Trübsal! Haltet an am Gebet!",
    reference: "Römer 12,12",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-ps-33-18",
    text: "Siehe, das Auge des HERRN ist gerichtet auf die, welche ihn fürchten, auf die, welche auf seine Gnade harren,",
    reference: "Psalm 33,18",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-ps-130-7",
    text: "Harre auf den HERRN, Israel! Denn bei dem HERRN ist die Gnade, und bei ihm ist viel Erlösung;",
    reference: "Psalm 130,7",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-1thess-5-8",
    text: "Wir aber, die wir dem Tag angehören, wollen nüchtern sein, angetan mit dem Brustpanzer des Glaubens und der Liebe und mit dem Helm der Hoffnung auf das Heil.",
    reference: "1. Thessalonicher 5,8",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-klg-3-24",
    text: "Der HERR ist mein Teil, spricht meine Seele; darum will ich auf ihn hoffen.",
    reference: "Klagelieder 3,24",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-1kor-13-13",
    text: "Nun aber bleiben Glaube, Hoffnung, Liebe, diese drei; die größte aber von diesen ist die Liebe.",
    reference: "1. Korinther 13,13",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-heb-10-23",
    text: "Lasst uns festhalten am Bekenntnis der Hoffnung, ohne zu wanken — denn er ist treu, der die Verheißung gegeben hat —",
    reference: "Hebräer 10,23",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-1tim-4-10",
    text: "Denn dafür arbeiten und kämpfen wir, weil wir unsere Hoffnung auf den lebendigen Gott gesetzt haben, welcher ein Retter aller Menschen ist, besonders der Gläubigen.",
    reference: "1. Timotheus 4,10",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-ps-146-5",
    text: "Wohl dem, dessen Hilfe der Gott Jakobs ist, dessen Hoffnung ruht auf dem HERRN, seinem Gott!",
    reference: "Psalm 146,5",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-jer-29-11",
    text: "Denn ich weiß, was für Gedanken ich über euch habe, spricht der HERR: Gedanken des Friedens und nicht des Unheils, um euch eine Zukunft und Hoffnung zu geben.",
    reference: "Jeremia 29,11",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-ps-39-8",
    text: "Und nun, worauf warte ich, Herr? Meine Hoffnung steht auf dich!",
    reference: "Psalm 39,8",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-1kor-1-7",
    text: "So dass ihr an keiner Gnadengabe Mangel habt, während ihr die Offenbarung unseres Herrn Jesus Christus erwartet,",
    reference: "1. Korinther 1,7",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-ps-31-25",
    text: "Seid stark und euer Herz fasse Mut, alle ihr, die ihr auf den HERRN hofft!",
    reference: "Psalm 31,25",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-mich-7-7",
    text: "Ich aber will ausschauen nach dem HERRN, ich will harren auf den Gott meines Heils; mein Gott wird mich erhören.",
    reference: "Micha 7,7",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "hope-rut-2-12",
    text: "Der HERR vergelte dir dein Werk, und dein Lohn möge vollkommen sein von dem HERRN, dem Gott Israels, zu dem du gekommen bist, um dich unter seine Flügel zu flüchten!",
    reference: "Ruth 2,12",
    theme: "hope",
    translation: "Schlachter 2000",
  },

  // === Love (Liebe / Nächstenliebe / Gottesliebe) ===
  {
    id: "love-1joh-4-16",
    text: "Und wir haben die Liebe erkannt und geglaubt, die Gott zu uns hat. Gott ist Liebe, und wer in der Liebe bleibt, der bleibt in Gott und Gott in ihm.",
    reference: "1. Johannes 4,16",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-joh-3-16",
    text: "Denn so sehr hat Gott die Welt geliebt, dass er seinen eingeborenen Sohn gab, damit jeder, der an ihn glaubt, nicht verloren geht, sondern ewiges Leben hat.",
    reference: "Johannes 3,16",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-1kor-13-4-5",
    text: "Die Liebe ist langmütig und gütig; die Liebe beneidet nicht; die Liebe prahlt nicht, sie bläht sich nicht auf; sie benimmt sich nicht unanständig, sie sucht nicht das Ihre, sie lässt sich nicht erbittern, sie rechnet das Böse nicht zu;",
    reference: "1. Korinther 13,4-5",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-1kor-13-7-8",
    text: "sie erträgt alles, sie glaubt alles, sie hofft alles, sie duldet alles. Die Liebe hört niemals auf; ob aber Weissagungen sind, sie werden weggetan werden; ob Sprachen, sie werden aufhören; ob Erkenntnis, sie wird weggetan werden.",
    reference: "1. Korinther 13,7-8",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-mark-12-31",
    text: "Das zweite ist ihm gleich: Du sollst deinen Nächsten lieben wie dich selbst. Größer als diese ist kein anderes Gebot.",
    reference: "Markus 12,31",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-joh-15-13",
    text: "Größere Liebe hat niemand als die, dass einer sein Leben lässt für seine Freunde.",
    reference: "Johannes 15,13",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-eph-4-32",
    text: "Seid aber zueinander gütig und barmherzig und vergebt einander, so wie auch Gott euch vergeben hat in Christus.",
    reference: "Epheser 4,32",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-gal-5-22-23",
    text: "Die Frucht des Geistes aber ist Liebe, Freude, Friede, Langmut, Freundlichkeit, Güte, Treue, Sanftmut, Enthaltsamkeit.",
    reference: "Galater 5,22-23",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-matt-5-44",
    text: "Ich aber sage euch: Liebt eure Feinde, segnet die, die euch fluchen, tut wohl denen, die euch hassen, und betet für die, welche euch beleidigen und verfolgen;",
    reference: "Matthäus 5,44",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-1joh-3-16",
    text: "Daran haben wir die Liebe erkannt, dass er sein Leben für uns hingegeben hat; auch wir sind schuldig, für die Brüder das Leben hinzugeben.",
    reference: "1. Johannes 3,16",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-1joh-2-10",
    text: "Wer seinen Bruder liebt, der bleibt im Licht, und es ist kein Ärgernis in ihm.",
    reference: "1. Johannes 2,10",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-kol-3-14",
    text: "Über dies alles aber zieht die Liebe an, die das Band der Vollkommenheit ist.",
    reference: "Kolosser 3,14",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-2kor-5-14",
    text: "Denn die Liebe des Christus drängt uns, weil wir zu der Überzeugung gekommen sind, dass, wenn einer für alle gestorben ist, so sind sie alle gestorben;",
    reference: "2. Korinther 5,14",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-1joh-4-18",
    text: "Furcht ist nicht in der Liebe, sondern die vollkommene Liebe treibt die Furcht aus; denn die Furcht hat Strafe. Wer sich fürchtet, ist nicht vollendet in der Liebe.",
    reference: "1. Johannes 4,18",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-ps-86-11",
    text: "Weise mir, HERR, deinen Weg, ich will wandeln in deiner Wahrheit; richte mein Herz auf die Furcht deines Namens!",
    reference: "Psalm 86,11",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-2tim-1-7",
    text: "Denn Gott hat uns nicht einen Geist der Furcht gegeben, sondern der Kraft und der Liebe und der Besonnenheit.",
    reference: "2. Timotheus 1,7",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-1joh-2-7-8",
    text: "Geliebte, ich schreibe euch nicht ein neues Gebot, sondern ein altes Gebot, das ihr von Anfang an hattet; das alte Gebot ist das Wort, das ihr von Anfang an gehört habt. Dennoch schreibe ich euch ein neues Gebot, das wahr ist in ihm und in euch; denn die Finsternis vergeht und das wahre Licht scheint schon.",
    reference: "1. Johannes 2,7-8",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-matt-5-7",
    text: "Glückselig sind die Barmherzigen; denn sie werden Barmherzigkeit erlangen!",
    reference: "Matthäus 5,7",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-1kor-14-1",
    text: "Strebt nach der Liebe! Bemüht euch um die geistlichen Gaben, besonders aber um die Weissagung!",
    reference: "1. Korinther 14,1",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-joh-13-35",
    text: "Daran wird jedermann erkennen, dass ihr meine Jünger seid, wenn ihr Liebe untereinander habt.",
    reference: "Johannes 13,35",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-rom-13-8",
    text: "Seid niemand etwas schuldig, außer dass ihr euch untereinander liebt; denn wer den anderen liebt, hat das Gesetz erfüllt.",
    reference: "Römer 13,8",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-gal-5-13",
    text: "Denn ihr seid zur Freiheit berufen, Brüder — nur gebraucht die Freiheit nicht zum Anlass für das Fleisch, sondern dient einander durch die Liebe!",
    reference: "Galater 5,13",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-1kor-16-14",
    text: "Alle eure Dinge lasst in Liebe geschehen!",
    reference: "1. Korinther 16,14",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-joh-15-17",
    text: "Das gebiete ich euch, dass ihr einander liebt.",
    reference: "Johannes 15,17",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-1joh-4-8",
    text: "Wer nicht liebt, hat Gott nicht erkannt; denn Gott ist Liebe.",
    reference: "1. Johannes 4,8",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-1joh-3-23",
    text: "Und das ist sein Gebot, dass wir an den Namen seines Sohnes Jesus Christus glauben und einander lieben, gleichwie er uns ein Gebot gegeben hat.",
    reference: "1. Johannes 3,23",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-1petr-4-8",
    text: "Vor allem habt innige Liebe untereinander; denn die Liebe bedeckt eine Menge von Sünden.",
    reference: "1. Petrus 4,8",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-2thess-3-5",
    text: "Der Herr aber lenke eure Herzen zu der Liebe Gottes und zur standhaften Erwartung des Christus!",
    reference: "2. Thessalonicher 3,5",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-jer-31-3",
    text: "Der HERR ist mir von ferne erschienen: Ich habe dich je und je geliebt; darum habe ich dich zu mir gezogen aus lauter Gnade.",
    reference: "Jeremia 31,3",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-eph-4-2",
    text: "Mit aller Demut und Sanftmut, mit Langmut; ertragt einander in Liebe,",
    reference: "Epheser 4,2",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-1joh-4-7",
    text: "Geliebte, lasst uns einander lieben; denn die Liebe ist aus Gott, und jeder, der liebt, ist aus Gott geboren und erkennt Gott.",
    reference: "1. Johannes 4,7",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-1joh-4-19",
    text: "Wir lieben, weil er uns zuerst geliebt hat.",
    reference: "1. Johannes 4,19",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-rom-5-8",
    text: "Gott aber beweist seine Liebe gegen uns dadurch, dass Christus für uns gestorben ist, als wir noch Sünder waren.",
    reference: "Römer 5,8",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-1petr-1-22",
    text: "Habt einander anhaltend lieb mit reinem Herzen, nachdem ihr eure Seelen gereinigt habt in Gehorsam gegen die Wahrheit durch den Geist zur ungeheuchelten Bruderliebe.",
    reference: "1. Petrus 1,22",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-joh-14-21",
    text: "Wer meine Gebote hat und sie hält, der ist es, der mich liebt; wer mich aber liebt, der wird von meinem Vater geliebt werden, und ich werde ihn lieben und mich ihm offenbaren.",
    reference: "Johannes 14,21",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-matt-22-37-39",
    text: "Du sollst den Herrn, deinen Gott, lieben mit deinem ganzen Herzen und mit deiner ganzen Seele und mit deinem ganzen Denken. Das ist das erste und größte Gebot. Und das zweite ist ihm gleich: Du sollst deinen Nächsten lieben wie dich selbst.",
    reference: "Matthäus 22,37-39",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-rom-12-10",
    text: "In der Bruderliebe seid herzlich zueinander, in der Ehrerbietung kommt einander zuvor!",
    reference: "Römer 12,10",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-hebr-13-1",
    text: "Die Bruderliebe soll bleiben!",
    reference: "Hebräer 13,1",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "love-1petr-3-8",
    text: "Endlich, seid alle gleichgesinnt, mitleidig, voller Bruderliebe, barmherzig, demütig!",
    reference: "1. Petrus 3,8",
    theme: "love",
    translation: "Schlachter 2000",
  },

  // === Mixed additional (faith/hope/love) to reach 100 ===
  {
    id: "extra-num-6-24-26",
    text: "Der HERR segne dich und behüte dich! Der HERR lasse sein Angesicht über dir leuchten und sei dir gnädig! Der HERR erhebe sein Angesicht auf dich und gebe dir Frieden!",
    reference: "4. Mose 6,24-26",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "extra-rom-8-38-39",
    text: "Denn ich bin überzeugt, dass weder Tod noch Leben, weder Engel noch Fürstentümer noch Gewalten, weder Gegenwärtiges noch Zukünftiges, weder Hohes noch Tiefes noch irgendein anderes Geschöpf uns zu scheiden vermag von der Liebe Gottes, die in Christus Jesus ist, unserem Herrn.",
    reference: "Römer 8,38-39",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "extra-ps-63-4",
    text: "Denn deine Güte ist besser als Leben; meine Lippen sollen dich loben!",
    reference: "Psalm 63,4",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "extra-ps-103-8",
    text: "Barmherzig und gnädig ist der HERR, langsam zum Zorn und groß an Güte.",
    reference: "Psalm 103,8",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "extra-ps-25-5",
    text: "Leite mich in deiner Wahrheit und lehre mich; denn du bist der Gott meines Heils! Auf dich harre ich allezeit.",
    reference: "Psalm 25,5",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "extra-ps-40-5",
    text: "Glücklich der Mann, der sein Vertrauen auf den HERRN setzt und sich nicht wendet zu den Hoffärtigen und zu den Abtrünnigen der Lüge!",
    reference: "Psalm 40,5",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "extra-ps-32-10",
    text: "Viele Schmerzen hat der Gottlose; wer aber auf den HERRN vertraut, den wird Güte umgeben.",
    reference: "Psalm 32,10",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "extra-joel-2-13",
    text: "Zerreißt eure Herzen und nicht eure Kleider und kehrt um zu dem HERRN, eurem Gott! Denn er ist gnädig und barmherzig, langsam zum Zorn und groß an Güte und lässt sich das Unheil gereuen.",
    reference: "Joel 2,13",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "extra-sach-4-6",
    text: "Nicht durch Heer oder Kraft, sondern durch meinen Geist, spricht der HERR der Heerscharen.",
    reference: "Sacharja 4,6",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "extra-ps-16-11",
    text: "Du wirst mir kundtun den Weg des Lebens; Fülle von Freuden ist vor deinem Angesicht, Lieblichkeiten in deiner Rechten ewiglich.",
    reference: "Psalm 16,11",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "extra-ps-55-23",
    text: "Wirf dein Anliegen auf den HERRN, und er wird dich versorgen; er wird niemals zulassen, dass der Gerechte wankt.",
    reference: "Psalm 55,23",
    theme: "faith",
    translation: "Schlachter 2000",
  },
  {
    id: "extra-ps-94-19",
    text: "Bei der Menge meiner Gedanken in meinem Innern erfüllten deine Tröstungen meine Seele mit Wonne.",
    reference: "Psalm 94,19",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "extra-1joh-3-18",
    text: "Meine Kinder, lasst uns nicht lieben mit Worten noch mit der Zunge, sondern in Tat und Wahrheit!",
    reference: "1. Johannes 3,18",
    theme: "love",
    translation: "Schlachter 2000",
  },
  {
    id: "extra-ps-121-1-2",
    text: "Ich hebe meine Augen auf zu den Bergen: Woher kommt mir Hilfe? Meine Hilfe kommt von dem HERRN, der Himmel und Erde gemacht hat.",
    reference: "Psalm 121,1-2",
    theme: "hope",
    translation: "Schlachter 2000",
  },
  {
    id: "extra-ps-145-18",
    text: "Der HERR ist nahe allen, die ihn anrufen, allen, die ihn in Wahrheit anrufen.",
    reference: "Psalm 145,18",
    theme: "faith",
    translation: "Schlachter 2000",
  },
];

/**
 * Returns verses filtered by theme.
 */
export function getVersesByTheme(theme: VerseTheme): BibleVerse[] {
  return BIBLE_VERSES.filter((v) => v.theme === theme);
}

/**
 * Basic sanity validator: Ensures no duplicate IDs or references.
 */
export function validateVerses(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const idSet = new Set<string>();
  const refSet = new Set<string>();

  for (const v of BIBLE_VERSES) {
    if (idSet.has(v.id)) errors.push(`Duplicate id: ${v.id}`);
    if (refSet.has(v.reference) && v.reference.includes(",")) {
      errors.push(`Duplicate reference (review): ${v.reference}`);
    }
    idSet.add(v.id);
    refSet.add(v.reference);
    if (v.translation !== "Schlachter 2000") {
      errors.push(`Unexpected translation tag: ${v.id}`);
    }
  }

  return { ok: errors.length === 0, errors };
}
