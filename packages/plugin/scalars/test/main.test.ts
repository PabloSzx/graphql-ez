import { buildClientSchema, getIntrospectionQuery, IntrospectionQuery, printSchema } from 'graphql';

import { CommonSchema, startFastifyServer } from 'graphql-ez-testing';

import { ezScalars } from '../src';

test('all scalars', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      ez: {
        plugins: [ezScalars('*')],
      },
      schema: [CommonSchema.schema],
    },
  });

  expect(printSchema(buildClientSchema((await query<IntrospectionQuery>(getIntrospectionQuery())).data!))).toMatchInlineSnapshot(`
   """"
   Directs the executor to defer this fragment when the \`if\` argument is true or undefined.
   """
   directive @defer(
     """Deferred when true or undefined."""
     if: Boolean

     """Unique name"""
     label: String
   ) on FRAGMENT_SPREAD | INLINE_FRAGMENT

   """
   Directs the executor to stream plural fields when the \`if\` argument is true or undefined.
   """
   directive @stream(
     """Stream when true or undefined."""
     if: Boolean

     """Unique name"""
     label: String

     """Number of items to return immediately"""
     initialCount: Int = 0
   ) on FIELD

   type Query {
     hello: String!
     users: [User!]!
     stream: [String!]
     context: String!
   }

   type User {
     id: Int!
   }

   """
   Banking account number is a string of 5 to 17 alphanumeric values for representing an generic account number
   """
   scalar AccountNumber

   """
   The \`BigInt\` scalar type represents non-fractional signed whole numeric values.
   """
   scalar BigInt

   """The \`Byte\` scalar type represents byte value as a Buffer"""
   scalar Byte

   """A country code as defined by ISO 3166-1 alpha-2"""
   scalar CountryCode

   """A country name (short name) as defined by ISO 3166-1"""
   scalar CountryName

   """
   A field whose value conforms to the standard cuid format as specified in https://github.com/ericelliott/cuid#broken-down
   """
   scalar Cuid

   """
   A field whose value is a Currency: https://en.wikipedia.org/wiki/ISO_4217.
   """
   scalar Currency

   """
   A date string, such as 2007-12-03, compliant with the \`full-date\` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
   """
   scalar Date

   """
   A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the \`date-time\` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
   """
   scalar DateTime

   """
   A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the \`date-time\` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.This scalar is serialized to a string in ISO 8601 format and parsed from a string in ISO 8601 format.
   """
   scalar DateTimeISO

   """
   A field whose value conforms to the standard DeweyDecimal format as specified by the OCLC https://www.oclc.org/content/dam/oclc/dewey/resources/summaries/deweysummaries.pdf
   """
   scalar DeweyDecimal

   """
   A field whose value conforms to the standard DID format as specified in did-core: https://www.w3.org/TR/did-core/.
   """
   scalar DID

   "\\n    A string representing a duration conforming to the ISO8601 standard,\\n    such as: P1W1DT13H23M34S\\n    P is the duration designator (for period) placed at the start of the duration representation.\\n    Y is the year designator that follows the value for the number of years.\\n    M is the month designator that follows the value for the number of months.\\n    W is the week designator that follows the value for the number of weeks.\\n    D is the day designator that follows the value for the number of days.\\n    T is the time designator that precedes the time components of the representation.\\n    H is the hour designator that follows the value for the number of hours.\\n    M is the minute designator that follows the value for the number of minutes.\\n    S is the second designator that follows the value for the number of seconds.\\n\\n    Note the time designator, T, that precedes the time value.\\n\\n    Matches moment.js, Luxon and DateFns implementations\\n    ,/. is valid for decimal places and +/- is a valid prefix\\n  "
   scalar Duration

   """
   A field whose value conforms to the standard internet email address format as specified in HTML Spec: https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address.
   """
   scalar EmailAddress

   """
   A GeoJSON object as defined by RFC 7946: https://datatracker.ietf.org/doc/html/rfc7946
   """
   scalar GeoJSON

   """
   A field whose value is a generic Universally Unique Identifier: https://en.wikipedia.org/wiki/Universally_unique_identifier.
   """
   scalar GUID

   """
   A field whose value is a hexadecimal: https://en.wikipedia.org/wiki/Hexadecimal.
   """
   scalar Hexadecimal

   """
   A field whose value is a hex color code: https://en.wikipedia.org/wiki/Web_colors.
   """
   scalar HexColorCode

   """
   A field whose value is a CSS HSL color: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#hsl()_and_hsla().
   """
   scalar HSL

   """
   A field whose value is a CSS HSLA color: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#hsl()_and_hsla().
   """
   scalar HSLA

   """
   A field whose value is an International Bank Account Number (IBAN): https://en.wikipedia.org/wiki/International_Bank_Account_Number.
   """
   scalar IBAN

   """
   A field whose value is either an IPv4 or IPv6 address: https://en.wikipedia.org/wiki/IP_address.
   """
   scalar IP

   """
   A field whose value is an IPC Class Symbol within the International Patent Classification System: https://www.wipo.int/classifications/ipc/en/
   """
   scalar IPCPatent

   """
   A field whose value is a IPv4 address: https://en.wikipedia.org/wiki/IPv4.
   """
   scalar IPv4

   """
   A field whose value is a IPv6 address: https://en.wikipedia.org/wiki/IPv6.
   """
   scalar IPv6

   """
   A field whose value is a ISBN-10 or ISBN-13 number: https://en.wikipedia.org/wiki/International_Standard_Book_Number.
   """
   scalar ISBN

   "\\n    A string representing a duration conforming to the ISO8601 standard,\\n    such as: P1W1DT13H23M34S\\n    P is the duration designator (for period) placed at the start of the duration representation.\\n    Y is the year designator that follows the value for the number of years.\\n    M is the month designator that follows the value for the number of months.\\n    W is the week designator that follows the value for the number of weeks.\\n    D is the day designator that follows the value for the number of days.\\n    T is the time designator that precedes the time components of the representation.\\n    H is the hour designator that follows the value for the number of hours.\\n    M is the minute designator that follows the value for the number of minutes.\\n    S is the second designator that follows the value for the number of seconds.\\n\\n    Note the time designator, T, that precedes the time value.\\n\\n    Matches moment.js, Luxon and DateFns implementations\\n    ,/. is valid for decimal places and +/- is a valid prefix\\n  "
   scalar ISO8601Duration

   """
   The \`JSON\` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
   """
   scalar JSON

   """
   The \`JSONObject\` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
   """
   scalar JSONObject

   """
   A field whose value is a JSON Web Token (JWT): https://jwt.io/introduction.
   """
   scalar JWT

   """
   A field whose value is a valid decimal degrees latitude number (53.471): https://en.wikipedia.org/wiki/Latitude
   """
   scalar Latitude

   """
   A field whose value conforms to the Library of Congress Subclass Format ttps://www.loc.gov/catdir/cpso/lcco/
   """
   scalar LCCSubclass

   """
   A local date string (i.e., with no associated timezone) in \`YYYY-MM-DD\` format, e.g. \`2020-01-01\`.
   """
   scalar LocalDate

   """
   A local date-time string (i.e., with no associated timezone) in \`YYYY-MM-DDTHH:mm:ss\` format, e.g. \`2020-01-01T00:00:00\`.
   """
   scalar LocalDateTime

   """The locale in the format of a BCP 47 (RFC 5646) standard string"""
   scalar Locale

   """
   A local time string (i.e., with no associated timezone) in 24-hr \`HH:mm[:ss[.SSS]]\` format, e.g. \`14:25\` or \`14:25:06\` or \`14:25:06.123\`.  This scalar is very similar to the \`LocalTime\`, with the only difference being that \`LocalEndTime\` also allows \`24:00\` as a valid value to indicate midnight of the following day.  This is useful when using the scalar to represent the exclusive upper bound of a time block.
   """
   scalar LocalEndTime

   """
   A local time string (i.e., with no associated timezone) in 24-hr \`HH:mm[:ss[.SSS]]\` format, e.g. \`14:25\` or \`14:25:06\` or \`14:25:06.123\`.
   """
   scalar LocalTime

   """
   The \`BigInt\` scalar type represents non-fractional signed whole numeric values.
   """
   scalar Long

   """
   A field whose value is a valid decimal degrees longitude number (53.471): https://en.wikipedia.org/wiki/Longitude
   """
   scalar Longitude

   """
   A field whose value is a IEEE 802 48-bit MAC address: https://en.wikipedia.org/wiki/MAC_address.
   """
   scalar MAC

   """Floats that will have a value less than 0."""
   scalar NegativeFloat

   """Integers that will have a value less than 0."""
   scalar NegativeInt

   """A string that cannot be passed as an empty value"""
   scalar NonEmptyString

   """Floats that will have a value of 0 or more."""
   scalar NonNegativeFloat

   """Integers that will have a value of 0 or more."""
   scalar NonNegativeInt

   """Floats that will have a value of 0 or less."""
   scalar NonPositiveFloat

   """Integers that will have a value of 0 or less."""
   scalar NonPositiveInt

   """
   A field whose value conforms with the standard mongodb object ID as described here: https://docs.mongodb.com/manual/reference/method/ObjectId/#ObjectId. Example: 5e5677d71bdc2ae76344968c
   """
   scalar ObjectID

   """
   A field whose value conforms to the standard E.164 format as specified in: https://en.wikipedia.org/wiki/E.164. Basically this is +17895551234.
   """
   scalar PhoneNumber

   """
   A field whose value is a valid TCP port within the range of 0 to 65535: https://en.wikipedia.org/wiki/Transmission_Control_Protocol#TCP_ports
   """
   scalar Port

   """Floats that will have a value greater than 0."""
   scalar PositiveFloat

   """Integers that will have a value greater than 0."""
   scalar PositiveInt

   """
   A field whose value conforms to the standard postal code formats for United States, United Kingdom, Germany, Canada, France, Italy, Australia, Netherlands, Spain, Denmark, Sweden, Belgium, India, Austria, Portugal, Switzerland or Luxembourg.
   """
   scalar PostalCode

   """
   A field whose value is a CSS RGB color: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#rgb()_and_rgba().
   """
   scalar RGB

   """
   A field whose value is a CSS RGBA color: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#rgb()_and_rgba().
   """
   scalar RGBA

   """
   In the US, an ABA routing transit number (\`ABA RTN\`) is a nine-digit code to identify the financial institution.
   """
   scalar RoutingNumber

   """
   The \`SafeInt\` scalar type represents non-fractional signed whole numeric values that are considered safe as defined by the ECMAScript specification.
   """
   scalar SafeInt

   """A field whose value is a Semantic Version: https://semver.org"""
   scalar SemVer

   """
   A field whose value conforms to the standard personal number (personnummer) formats for Sweden
   """
   scalar SESSN

   """
   A time string at UTC, such as 10:15:30Z, compliant with the \`full-time\` format outlined in section 5.6 of the RFC 3339profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
   """
   scalar Time

   """
   The javascript \`Date\` as integer. Type represents date and time as number of milliseconds from start of UNIX epoch.
   """
   scalar Timestamp

   """
   A field whose value exists in the standard IANA Time Zone Database: https://www.iana.org/time-zones
   """
   scalar TimeZone

   """Floats that will have a value of 0 or more."""
   scalar UnsignedFloat

   """Integers that will have a value of 0 or more."""
   scalar UnsignedInt

   """
   A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt.
   """
   scalar URL

   """A currency string, such as $21.25"""
   scalar USCurrency

   """
   A field whose value is a UTC Offset: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
   """
   scalar UtcOffset

   """
   A field whose value is a generic Universally Unique Identifier: https://en.wikipedia.org/wiki/Universally_unique_identifier.
   """
   scalar UUID

   """Represents NULL values"""
   scalar Void"
  `);
});

test('scalars in list', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      ez: {
        plugins: [ezScalars(['Currency'])],
      },
      schema: [CommonSchema.schema],
    },
  });

  expect(printSchema(buildClientSchema((await query<IntrospectionQuery>(getIntrospectionQuery())).data!))).toMatchInlineSnapshot(`
    """"
    Directs the executor to defer this fragment when the \`if\` argument is true or undefined.
    """
    directive @defer(
      """Deferred when true or undefined."""
      if: Boolean

      """Unique name"""
      label: String
    ) on FRAGMENT_SPREAD | INLINE_FRAGMENT

    """
    Directs the executor to stream plural fields when the \`if\` argument is true or undefined.
    """
    directive @stream(
      """Stream when true or undefined."""
      if: Boolean

      """Unique name"""
      label: String

      """Number of items to return immediately"""
      initialCount: Int = 0
    ) on FIELD

    type Query {
      hello: String!
      users: [User!]!
      stream: [String!]
      context: String!
    }

    type User {
      id: Int!
    }

    """
    A field whose value is a Currency: https://en.wikipedia.org/wiki/ISO_4217.
    """
    scalar Currency"
  `);
});

test('scalars in object', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      ez: {
        plugins: [
          ezScalars({
            DateTime: 1,
            Date: 0,
          }),
        ],
      },
      schema: [CommonSchema.schema],
    },
  });

  expect(printSchema(buildClientSchema((await query<IntrospectionQuery>(getIntrospectionQuery())).data!))).toMatchInlineSnapshot(`
    """"
    Directs the executor to defer this fragment when the \`if\` argument is true or undefined.
    """
    directive @defer(
      """Deferred when true or undefined."""
      if: Boolean

      """Unique name"""
      label: String
    ) on FRAGMENT_SPREAD | INLINE_FRAGMENT

    """
    Directs the executor to stream plural fields when the \`if\` argument is true or undefined.
    """
    directive @stream(
      """Stream when true or undefined."""
      if: Boolean

      """Unique name"""
      label: String

      """Number of items to return immediately"""
      initialCount: Int = 0
    ) on FIELD

    type Query {
      hello: String!
      users: [User!]!
      stream: [String!]
      context: String!
    }

    type User {
      id: Int!
    }

    """
    A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the \`date-time\` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
    """
    scalar DateTime"
  `);
});
